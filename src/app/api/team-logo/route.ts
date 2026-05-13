import { NextRequest, NextResponse } from "next/server";

const UA = "PlayfulBet/1.0 (https://github.com/alvaro8rey/bet; contact@playfulbet.com)";

async function wikiSummary(title: string): Promise<string | null> {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: { "User-Agent": UA, Accept: "application/json" }, next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  const d = await res.json();
  return d.thumbnail?.source ?? null;
}

async function wikiSearch(query: string): Promise<string | null> {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&srnamespace=0`,
    { headers: { "User-Agent": UA }, next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  const d = await res.json();
  const title = d?.query?.search?.[0]?.title;
  if (!title) return null;

  const img = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=200&titles=${encodeURIComponent(title)}`,
    { headers: { "User-Agent": UA }, next: { revalidate: 86400 } }
  );
  if (!img.ok) return null;
  const imgd = await img.json();
  const pages = Object.values(imgd?.query?.pages ?? {}) as any[];
  return pages[0]?.thumbnail?.source ?? null;
}

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ url: null });

  // Try direct Wikipedia lookups with common naming patterns
  for (const v of [team, `${team} F.C.`, `${team} FC`, `FC ${team}`, `${team} CF`]) {
    try {
      const url = await wikiSummary(v);
      if (url) return NextResponse.json({ url });
    } catch { /* continue */ }
  }

  // Fallback: Wikipedia search
  try {
    const url = await wikiSearch(`${team} football club`);
    if (url) return NextResponse.json({ url });
  } catch { /* continue */ }

  return NextResponse.json({ url: null });
}
