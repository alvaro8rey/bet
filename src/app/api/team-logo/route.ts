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
const ESPN_SOCCER = [
  "esp.1", "esp.2", "esp.3",
  "eng.1", "eng.2", "eng.3",
  "ger.1", "ger.2",
  "ita.1", "ita.2",
  "fra.1", "fra.2",
  "por.1", "por.2",
  "ned.1",
  "sco.1",
  "usa.1",
  "uefa.champions", "uefa.europa", "uefa.europa.conf",
];
const ESPN_OTHER = [
  { sport: "basketball", league: "nba" },
  { sport: "basketball", league: "mens-college-basketball" },
  { sport: "baseball",   league: "mlb" },
  { sport: "hockey",     league: "nhl" },
  { sport: "football",   league: "nfl" },
];

// ── helpers ──────────────────────────────────────────────────────────────────
function clean(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matches(fdName: string, fdShort: string, fdTla: string, query: string): boolean {
  const q = clean(query);
  if (q.length < 3) return false;
  const name  = clean(fdName);
  const short = clean(fdShort);
  const tla   = clean(fdTla);
  if (name === q || short === q || tla === q) return true;
  if (name.length  >= 3 && (name.includes(q)  || q.includes(name)))  return true;
  if (short.length >= 3 && (short.includes(q) || q.includes(short))) return true;
  return false;
}

// ── football-data.org lookup ─────────────────────────────────────────────────
async function footballDataLogo(team: string): Promise<string | null> {
  if (!FOOTBALL_DATA_KEY) return null;
  for (const comp of FD_COMPETITIONS) {
    try {
      const res = await fetch(`https://api.football-data.org/v4/competitions/${comp}/teams`, FD_OPTS);
      if (!res.ok) continue;
      const d = await res.json();
      const found = (d?.teams as FDTeam[] ?? []).find((t) => matches(t.name, t.shortName, t.tla, team));
      if (found?.crest) return found.crest;
    } catch { /* continue */ }
  }
  return null;
}

// ── ESPN lookup ──────────────────────────────────────────────────────────────
function extractEspnTeams(d: unknown): { name: string; short: string; abbr: string; logo: string }[] {
  const out: { name: string; short: string; abbr: string; logo: string }[] = [];
  const raw = (d as any)?.sports?.[0]?.leagues?.[0]?.teams ?? (d as any)?.teams ?? [];
  for (const item of raw) {
    const t = item?.team ?? item;
    const logo = t?.logos?.[0]?.href ?? t?.logo ?? "";
    if (logo) out.push({ name: t.displayName ?? t.name ?? "", short: t.shortDisplayName ?? t.shortName ?? "", abbr: t.abbreviation ?? "", logo });
  }
  return out;
}

async function espnLeagueLogo(sport: string, league: string, team: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams?limit=200`,
      ESPN_OPTS
    );
    if (!res.ok) return null;
    const d = await res.json();
    const found = extractEspnTeams(d).find((t) => matches(t.name, t.short, t.abbr, team));
    return found?.logo ?? null;
  } catch {
    return null;
  }
}

async function espnLogo(team: string): Promise<string | null> {
  // Soccer leagues (in parallel batches to keep latency reasonable)
  for (const league of ESPN_SOCCER) {
    const logo = await espnLeagueLogo("soccer", league, team);
    if (logo) return logo;
  }
  // Other sports
  for (const { sport, league } of ESPN_OTHER) {
    const logo = await espnLeagueLogo(sport, league, team);
    if (logo) return logo;
  }
  return null;
}

// ── route ────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ url: null });

  // 1. football-data.org — best quality SVG crests for major EU leagues
  const fdLogo = await footballDataLogo(team);
  if (fdLogo) return NextResponse.json({ url: fdLogo });

  // 2. ESPN — broader coverage (NBA, 2nd divisions, more leagues)
  const eLogo = await espnLogo(team);
  if (eLogo) return NextResponse.json({ url: eLogo });

  return NextResponse.json({ url: null });
}
