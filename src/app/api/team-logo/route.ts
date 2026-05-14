import { NextRequest, NextResponse } from "next/server";

// ── football-data.org ────────────────────────────────────────────────────────
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY ?? "";
const FD_OPTS = {
  headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
  next: { revalidate: 86400 },
};
const FD_COMPETITIONS = ["PD", "PL", "BL1", "SA", "FL1", "CL", "EL", "PPL", "DED", "ELC"];

interface FDTeam { name: string; shortName: string; tla: string; crest: string; }

// ── ESPN (no auth needed) ────────────────────────────────────────────────────
const ESPN_OPTS = { next: { revalidate: 86400 } };

const ESPN_BY_SPORT: Record<string, { sport: string; league: string }[]> = {
  football: [
    "esp.1","esp.2","esp.3","eng.1","eng.2","eng.3",
    "ger.1","ger.2","ita.1","ita.2","fra.1","fra.2",
    "por.1","por.2","ned.1","sco.1","usa.1",
    "uefa.champions","uefa.europa","uefa.europa.conf",
  ].map((l) => ({ sport: "soccer", league: l })),

  basketball: [
    { sport: "basketball", league: "nba" },
    { sport: "basketball", league: "mens-college-basketball" },
    { sport: "basketball", league: "wnba" },
  ],

  baseball: [
    { sport: "baseball", league: "mlb" },
  ],

  hockey: [
    { sport: "hockey", league: "nhl" },
  ],

  american_football: [
    { sport: "football", league: "nfl" },
    { sport: "football", league: "college-football" },
  ],

  other: [
    { sport: "basketball", league: "nba" },
    { sport: "soccer", league: "esp.1" },
    { sport: "soccer", league: "eng.1" },
    { sport: "hockey", league: "nhl" },
    { sport: "baseball", league: "mlb" },
    { sport: "football", league: "nfl" },
  ],
};

// ── helpers ──────────────────────────────────────────────────────────────────
function clean(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Word-level matching to avoid "spurs" in "sanantoniospurs" matching Tottenham
function wordMatches(haystack: string, needle: string): boolean {
  const words = needle.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
  if (words.length === 0) return false;
  const h = haystack.toLowerCase();
  // All significant words of needle must appear in haystack
  return words.every((w) => h.includes(w));
}

function matches(name: string, short: string, abbr: string, query: string): boolean {
  const q = clean(query);
  if (q.length < 3) return false;

  const n = clean(name);
  const s = clean(short);
  const a = clean(abbr);

  // Exact match (most reliable)
  if (n === q || s === q || a === q) return true;

  // Full name contains full query or vice-versa (character level, both >= 5 chars to avoid short false positives)
  if (n.length >= 5 && q.length >= 5 && (n === q || (n.length > q.length ? n.includes(q) : q.includes(n)))) return true;

  // Word-level: every word in the query appears in the full team name
  if (wordMatches(name, query)) return true;
  // Word-level: every word in the team name appears in the query
  if (wordMatches(query, name)) return true;
  if (name !== short && wordMatches(query, short)) return true;

  return false;
}

// ── football-data.org lookup ─────────────────────────────────────────────────
async function footballDataLogo(team: string): Promise<string | null> {
  if (!FOOTBALL_DATA_KEY) return null;
  for (const comp of FD_COMPETITIONS) {
    try {
      const res = await fetch(`https://api.football-data.org/v4/competitions/${comp}/teams`, FD_OPTS);
      if (!res.ok) continue;
      const found = ((await res.json())?.teams as FDTeam[] ?? [])
        .find((t) => matches(t.name, t.shortName, t.tla, team));
      if (found?.crest) return found.crest;
    } catch { /* continue */ }
  }
  return null;
}

// ── ESPN lookup ──────────────────────────────────────────────────────────────
function extractEspnTeams(d: unknown): { name: string; short: string; abbr: string; logo: string }[] {
  const raw = (d as any)?.sports?.[0]?.leagues?.[0]?.teams ?? (d as any)?.teams ?? [];
  return (raw as any[]).flatMap((item: any) => {
    const t = item?.team ?? item;
    const logo = t?.logos?.[0]?.href ?? t?.logo ?? "";
    return logo ? [{ name: t.displayName ?? t.name ?? "", short: t.shortDisplayName ?? t.shortName ?? "", abbr: t.abbreviation ?? "", logo }] : [];
  });
}

async function espnLeagueLogo(sport: string, league: string, team: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams?limit=200`,
      ESPN_OPTS
    );
    if (!res.ok) return null;
    const found = extractEspnTeams(await res.json()).find((t) => matches(t.name, t.short, t.abbr, team));
    return found?.logo ?? null;
  } catch {
    return null;
  }
}

async function espnLogo(team: string, appSport: string): Promise<string | null> {
  const leagues = ESPN_BY_SPORT[appSport] ?? ESPN_BY_SPORT.other;
  for (const { sport, league } of leagues) {
    const logo = await espnLeagueLogo(sport, league, team);
    if (logo) return logo;
  }
  return null;
}

// ── route ────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  const sport = req.nextUrl.searchParams.get("sport") ?? "other"; // e.g. "football", "basketball"
  if (!team) return NextResponse.json({ url: null });

  // For football, try football-data.org first (better quality SVG crests)
  if (sport === "football") {
    const fdLogo = await footballDataLogo(team);
    if (fdLogo) return NextResponse.json({ url: fdLogo });
  }

  // ESPN — scoped to the correct sport so basketball never searches soccer leagues
  const eLogo = await espnLogo(team, sport);
  if (eLogo) return NextResponse.json({ url: eLogo });

  // Non-football fallback: try football-data.org last
  if (sport !== "football") {
    const fdLogo = await footballDataLogo(team);
    if (fdLogo) return NextResponse.json({ url: fdLogo });
  }

  return NextResponse.json({ url: null });
}
