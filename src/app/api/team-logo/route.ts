import { NextRequest, NextResponse } from "next/server";

// ── football-data.org ────────────────────────────────────────────────────────
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY ?? "";
const fdOpts = () => ({
  headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
  next: { revalidate: 86400 },
  signal: AbortSignal.timeout(8_000),
});
const FD_COMPETITIONS = ["PD", "PL", "BL1", "SA", "FL1", "CL", "EL", "PPL", "DED", "ELC"];

interface FDTeam { name: string; shortName: string; tla: string; crest: string; }

// ── ESPN (no auth needed) ────────────────────────────────────────────────────
const espnOpts = () => ({ next: { revalidate: 86400 }, signal: AbortSignal.timeout(8_000) });

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
  "athletic bilbao":       ["athletic club", "athletic club de bilbao"],
  "athletic club bilbao":  ["athletic club"],
  "real sociedad":         ["real sociedad de fútbol"],
  "deportivo alaves":      ["deportivo alavés", "alaves"],
  "rayo vallecano":        ["rayo vallecano de madrid"],
  "villarreal":            ["villarreal cf"],
  "sevilla":               ["sevilla fc"],
  "valencia":              ["valencia cf"],
  "osasuna":               ["ca osasuna"],
  "getafe":                ["getafe cf"],
  "girona":                ["girona fc"],
  "las palmas":            ["ud las palmas"],
  "mallorca":              ["rcd mallorca"],
  "espanyol":              ["rcd espanyol"],
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
      const res = await fetch(`https://api.football-data.org/v4/competitions/${comp}/teams`, fdOpts());
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
      espnOpts()
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
// ── nationality → ESPN flag code (sports conventions differ from ISO) ────────
const NATIONALITY_TO_FLAG: Record<string, string> = {
  french: "fra", spanish: "esp", italian: "ita", american: "usa", german: "ger",
  serbian: "srb", greek: "gre", norwegian: "nor", australian: "aus", british: "gbr",
  canadian: "can", argentine: "arg", chilean: "chi", czech: "cze", polish: "pol",
  danish: "den", finnish: "fin", swiss: "sui", dutch: "ned", belgian: "bel",
  russian: "rus", kazakh: "kaz", ukrainian: "ukr", belarusian: "blr",
  croatian: "cro", bulgarian: "bul", romanian: "rou", hungarian: "hun",
  slovak: "svk", austrian: "aut", estonian: "est", latvian: "lat", lithuanian: "ltu",
  japanese: "jpn", "south korean": "kor", korean: "kor", chinese: "chn", taiwanese: "tpe",
  brazilian: "bra", mexican: "mex", colombian: "col", "south african": "rsa",
  swedish: "swe", portuguese: "por", turkish: "tur", georgian: "geo",
  bosnian: "bih", "herzegovinian": "bih", slovenian: "slo", macedonian: "mkd",
  montenegrin: "mne", albanian: "alb", moldovan: "mda", uzbek: "uzb",
  armenian: "arm", azerbaijani: "aze", tunisian: "tun", moroccan: "mar",
  egyptian: "egy", "south african": "rsa", zimbabwean: "zim",
  peruvian: "per", ecuadorian: "ecu", venezuelan: "ven", paraguayan: "par",
  bolivian: "bol", uruguayan: "uru", trinidadian: "tto",
  thai: "tha", indonesian: "ina", philippine: "phi", vietnamese: "vie",
  indian: "ind", pakistani: "pak", "sri lankan": "slk",
  iraqi: "irq", iranian: "iri", israeli: "isr", jordanian: "jor",
  luxembourgish: "lux", monégasque: "mon", icelandic: "isl",
  cypriot: "cyp", maltese: "mlt", liechtenstein: "lie",
};

async function espnTennisPhoto(playerName: string): Promise<string | null> {
  // 1. Wikipedia — nationality flag (always preferred, consistent look)
  try {
    const slug = playerName.trim().replace(/ /g, "_");
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}?redirect=true`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8_000) }
    );
    if (res.ok) {
      const data = await res.json();
      const desc = (data?.description ?? data?.extract ?? "").toLowerCase();
      for (const [nationality, code] of Object.entries(NATIONALITY_TO_FLAG)) {
        if (desc.includes(nationality)) {
          return `https://a.espncdn.com/i/teamlogos/countries/500/${code}.png`;
        }
      }
    }
  } catch { /* continue */ }

  // 2. ESPN scoreboard fallback — flag from live/today matches
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const q = clean(playerName);
  for (const league of ["atp", "wta"]) {
    for (const url of [
      `https://site.api.espn.com/apis/site/v2/sports/tennis/${league}/scoreboard?dates=${today}`,
      `https://site.api.espn.com/apis/site/v2/sports/tennis/${league}/scoreboard`,
    ]) {
      try {
        const res = await fetch(url, espnOpts());
        if (!res.ok) continue;
        for (const event of (await res.json())?.events ?? []) {
          for (const competitor of event?.competitions?.[0]?.competitors ?? []) {
            const athlete = competitor?.athlete;
            if (!athlete) continue;
            const name = clean(athlete.displayName ?? athlete.fullName ?? "");
            if (name === q || name.includes(q)) {
              // Only return flag, not headshot
              if (athlete.flag?.href) return athlete.flag.href;
            }
          }
        }
      } catch { /* continue */ }
    }
  }

  console.log(`[tennis] no result for "${playerName}"`);
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
