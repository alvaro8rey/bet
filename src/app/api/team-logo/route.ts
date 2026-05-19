import { NextRequest, NextResponse } from "next/server";

// ── football-data.org ────────────────────────────────────────────────────────
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY ?? "";
const FD_OPTS = {
  headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
  next: { revalidate: 86400 },
  signal: AbortSignal.timeout(8_000),
};
const FD_COMPETITIONS = ["PD", "PL", "BL1", "SA", "FL1", "CL", "EL", "PPL", "DED", "ELC"];

interface FDTeam { name: string; shortName: string; tla: string; crest: string; }

// ── ESPN (no auth needed) ────────────────────────────────────────────────────
const ESPN_OPTS = { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8_000) };

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

// ── team name aliases ─────────────────────────────────────────────────────────
const TEAM_ALIASES: Record<string, string[]> = {
  "sporting lisbon":       ["sporting cp", "sporting clube de portugal"],
  "paris saint-germain":   ["paris sg", "psg"],
  "paris saint germain":   ["paris sg", "psg"],
  "atletico madrid":       ["atlético de madrid", "atletico de madrid"],
  "atletico de madrid":    ["atlético de madrid"],
  "celta vigo":            ["rc celta", "celta de vigo"],
  "real betis":            ["real betis balompié"],
  "inter milan":           ["fc internazionale milano", "internazionale"],
  "ac milan":              ["milan"],
  "manchester city":       ["manchester city fc"],
  "manchester united":     ["manchester united fc"],
  "tottenham":             ["tottenham hotspur"],
  "wolves":                ["wolverhampton wanderers"],
  "newcastle":             ["newcastle united"],
  "brighton":              ["brighton & hove albion"],
  "west ham":              ["west ham united"],
  "leicester":             ["leicester city"],
  "nottingham forest":     ["nottingham forest"],
  "sheffield united":      ["sheffield utd"],
};

function resolveAliases(team: string): string[] {
  const key = team.toLowerCase();
  return [team, ...(TEAM_ALIASES[key] ?? [])];
}

// ── helpers ──────────────────────────────────────────────────────────────────
function clean(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const STOPWORDS  = new Set(["de", "la", "el", "al", "del", "los", "las"]);
const QUALIFIERS = new Set(["fc", "cf", "sc", "fk", "afc", "bk", "ik", "sk"]);

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/\s+/).filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

function wordMatches(apiName: string, query: string): boolean {
  const qWords = tokenize(query);
  const nWords = tokenize(apiName);
  if (qWords.length === 0) return false;

  const cn = clean(apiName);
  const cq = clean(query);

  if (!qWords.every((w) => cn.includes(clean(w)))) return false;

  const nSig = nWords.filter((w) => !QUALIFIERS.has(w));
  return nSig.length === 0 || nSig.every((w) => cq.includes(clean(w)));
}

function matches(name: string, short: string, abbr: string, query: string): boolean {
  const q = clean(query);
  if (q.length < 2) return false;

  if (clean(name) === q || clean(short) === q || clean(abbr) === q) return true;

  // Partial match: query fully contained in name or vice versa
  if (clean(name).includes(q) || q.includes(clean(name))) return true;

  return wordMatches(name, query) || wordMatches(short, query);
}

// ── football-data.org lookup ─────────────────────────────────────────────────
async function footballDataLogo(team: string): Promise<string | null> {
  if (!FOOTBALL_DATA_KEY) return null;
  const queries = resolveAliases(team);
  for (const comp of FD_COMPETITIONS) {
    try {
      const res = await fetch(`https://api.football-data.org/v4/competitions/${comp}/teams`, FD_OPTS);
      if (!res.ok) continue;
      const teams = (await res.json())?.teams as FDTeam[] ?? [];
      for (const q of queries) {
        const found = teams.find((t) => matches(t.name, t.shortName, t.tla, q));
        if (found?.crest) return found.crest;
      }
    } catch { /* continue */ }
  }
  return null;
}

// ── ESPN team lookup ─────────────────────────────────────────────────────────
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
  const queries = resolveAliases(team);
  const leagues = ESPN_BY_SPORT[appSport] ?? ESPN_BY_SPORT.other;
  for (const { sport, league } of leagues) {
    for (const q of queries) {
      const logo = await espnLeagueLogo(sport, league, q);
      if (logo) return logo;
    }
  }
  return null;
}

// ── ESPN tennis athlete lookup ───────────────────────────────────────────────
async function espnTennisPhoto(playerName: string): Promise<string | null> {
  const tours = [
    { sport: "tennis", league: "atp" },
    { sport: "tennis", league: "wta" },
  ];

  const q = clean(playerName);

  for (const { sport, league } of tours) {
    try {
      const listRes = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/athletes?limit=500&active=true`,
        ESPN_OPTS
      );
      if (!listRes.ok) { console.log(`[tennis] ${league} list ${listRes.status}`); continue; }
      const data = await listRes.json();
      const athletes: any[] = data?.athletes ?? data?.items ?? [];
      console.log(`[tennis] ${league} — ${athletes.length} athletes, query="${q}"`);

      const found = athletes.find((a: any) => {
        const name = clean(a.displayName ?? a.fullName ?? a.name ?? "");
        const last = clean(a.lastName ?? "");
        return name === q || name.includes(q) || (last.length > 3 && q.includes(last));
      });

      if (!found) { console.log(`[tennis] ${league} — no match for "${playerName}"`); continue; }
      console.log(`[tennis] found: ${found.displayName} id=${found.id} headshot=${found.headshot?.href} flag=${found.flag?.href}`);

      if (found.headshot?.href) return found.headshot.href;
      if (found.flag?.href) return found.flag.href;

      if (found.id) {
        const detailRes = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/athletes/${found.id}`,
          ESPN_OPTS
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const athlete = detail?.athlete ?? detail;
          console.log(`[tennis] detail keys: ${Object.keys(athlete).join(", ")}`);
          const headshot = athlete?.headshot?.href;
          if (headshot) return headshot;
          const flag = athlete?.flag?.href ?? athlete?.citizenship?.flag?.href;
          console.log(`[tennis] detail headshot=${headshot} flag=${flag}`);
          if (flag) return flag;
        } else {
          console.log(`[tennis] detail fetch failed: ${detailRes.status}`);
        }
      }
    } catch (e) { console.log(`[tennis] error: ${e}`); }
  }
  console.log(`[tennis] no photo found for "${playerName}"`);
  return null;
}

// ── route ────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  const sport = req.nextUrl.searchParams.get("sport") ?? "other";
  if (!team) return NextResponse.json({ url: null });

  console.log(`[team-logo] team="${team}" sport="${sport}"`);

  if (sport === "tennis") {
    const photo = await espnTennisPhoto(team);
    console.log(`[team-logo] tennis result: ${photo}`);
    return NextResponse.json({ url: photo });
  }

  if (sport === "football") {
    const fdLogo = await footballDataLogo(team);
    if (fdLogo) { console.log(`[team-logo] fd hit: ${fdLogo}`); return NextResponse.json({ url: fdLogo }); }
    console.log(`[team-logo] fd miss for "${team}"`);
  }

  const eLogo = await espnLogo(team, sport);
  if (eLogo) { console.log(`[team-logo] espn hit: ${eLogo}`); return NextResponse.json({ url: eLogo }); }
  console.log(`[team-logo] espn miss for "${team}" sport="${sport}"`);

  if (sport !== "football") {
    const fdLogo = await footballDataLogo(team);
    if (fdLogo) return NextResponse.json({ url: fdLogo });
  }

  console.log(`[team-logo] no result for "${team}"`);
  return NextResponse.json({ url: null });
}
