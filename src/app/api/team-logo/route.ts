import { NextRequest, NextResponse } from "next/server";

const UA = "PlayfulBet/1.0 (sports betting app; https://github.com/alvaro8rey/bet)";

async function getLogoFromWikidata(teamName: string): Promise<string | null> {
  // Step 1: search Wikidata for the team entity
  const searchRes = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(teamName)}&language=en&type=item&format=json&limit=5`,
    { headers: { "User-Agent": UA }, next: { revalidate: 86400 } }
  );
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  const results: { id: string }[] = searchData.search ?? [];
  if (!results.length) return null;

  // Step 2: for top results, look for the P154 (logo image) claim
  for (const result of results.slice(0, 3)) {
    const entityRes = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${result.id}&props=claims&format=json`,
      { headers: { "User-Agent": UA }, next: { revalidate: 86400 } }
    );
    if (!entityRes.ok) continue;
    const entityData = await entityRes.json();
    const filename =
      entityData.entities?.[result.id]?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
    if (filename) {
      // Wikimedia Commons Special:FilePath redirects to the actual file
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ url: null });

  // Try exact name and common variations
  const variations = [team, `${team} FC`, `FC ${team}`, `${team} CF`, `RC ${team}`];

  for (const v of variations) {
    try {
      const url = await getLogoFromWikidata(v);
      if (url) return NextResponse.json({ url });
    } catch { /* continue */ }
  }

  return NextResponse.json({ url: null });
}
