import { NextRequest, NextResponse } from "next/server";

const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY ?? "";
const FOOTBALL_DATA_OPTS = {
  headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
  next: { revalidate: 86400 },
};

const WIKI_UA = "PlayfulBet/1.0 (sports app; https://github.com/alvaro8rey/bet)";
const WIKI_OPTS = {
  headers: { "User-Agent": WIKI_UA, Accept: "application/json" },
  next: { revalidate: 86400 },
};

async function footballDataLogo(team: string): Promise<string | null> {
  if (!FOOTBALL_DATA_KEY) return null;
  try {
    const res = await fetch(
      `https://api.football-data.org/v4/teams?name=${encodeURIComponent(team)}`,
      FOOTBALL_DATA_OPTS
    );
    if (!res.ok) return null;
    const d = await res.json();
    const teams: { name: string; shortName: string; crest: string }[] = d?.teams ?? [];
    if (teams.length === 0) return null;
    return teams[0].crest ?? null;
  } catch {
    return null;
  }
}

async function pageImageFree(title: string): Promise<string | null> {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageprops&format=json`,
    WIKI_OPTS
  );
  if (!res.ok) return null;
  const d = await res.json();
  const pages = Object.values(d?.query?.pages ?? {}) as any[];
  const img = pages[0]?.pageprops?.page_image_free;
  if (!img) return null;
  // Only accept files that look like logos (SVG, PNG with "logo" or "crest" or "fc" in name)
  const lower = img.toLowerCase();
  if (!lower.match(/\.(svg|png)$/)) return null;
  if (!lower.match(/logo|crest|escudo|badge|fc_|cf_|_fc|_cf/)) return null;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(img)}`;
}

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ url: null });

  // 1. Try football-data.org (best source for football clubs)
  const fdLogo = await footballDataLogo(team);
  if (fdLogo) return NextResponse.json({ url: fdLogo });

  // 2. Try Wikipedia page_image_free with logo filter
  for (const v of [team, `${team} FC`, `FC ${team}`, `${team} F.C.`]) {
    try {
      const url = await pageImageFree(v);
      if (url) return NextResponse.json({ url });
    } catch { /* continue */ }
  }

  return NextResponse.json({ url: null });
}
