import { NextRequest, NextResponse } from "next/server";

const HEADERS = {
  "User-Agent": "PlayfulBet/1.0 (sports app; contact@playfulbet.com)",
  "Accept": "application/json",
};

async function tryWikipediaSummary(title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: HEADERS, next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source ?? data.originalimage?.source ?? null;
  } catch {
    return null;
  }
}

async function getLogoViaWikipediaSearch(teamName: string): Promise<string | null> {
  try {
    // Search Wikipedia for the team article
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(teamName)}&format=json&srlimit=3&srnamespace=0`,
      { headers: HEADERS, next: { revalidate: 86400 } }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const results: { title: string }[] = searchData?.query?.search ?? [];
    if (!results.length) return null;

    // Try the top search results for a thumbnail
    for (const result of results.slice(0, 2)) {
      const imgRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=200&titles=${encodeURIComponent(result.title)}`,
        { headers: HEADERS, next: { revalidate: 86400 } }
      );
      if (!imgRes.ok) continue;
      const imgData = await imgRes.json();
      const pages = Object.values(imgData?.query?.pages ?? {}) as any[];
      const src = pages[0]?.thumbnail?.source;
      if (src) return src;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ url: null });

  // Try direct Wikipedia summary first, then fallback to search
  const variations = [
    team,
    `${team} F.C.`,
    `${team} FC`,
    `FC ${team}`,
    `${team} CF`,
  ];

  for (const variant of variations) {
    const url = await tryWikipediaSummary(variant);
    if (url) return NextResponse.json({ url });
  }

  // Fallback: search Wikipedia
  const url = await getLogoViaWikipediaSearch(team);
  return NextResponse.json({ url });
}
