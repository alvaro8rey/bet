import { NextRequest, NextResponse } from "next/server";

const UA = "PlayfulBet/1.0 (sports app; https://github.com/alvaro8rey/bet)";
const OPTS = { headers: { "User-Agent": UA, Accept: "application/json" }, next: { revalidate: 86400 } };

async function pageImageFree(title: string): Promise<string | null> {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageprops&format=json`,
    OPTS
  );
  if (!res.ok) return null;
  const d = await res.json();
  const pages = Object.values(d?.query?.pages ?? {}) as any[];
  const img = pages[0]?.pageprops?.page_image_free;
  if (!img) return null;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(img)}`;
}

async function searchAndGetLogo(query: string): Promise<string | null> {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3&srnamespace=0`,
    OPTS
  );
  if (!res.ok) return null;
  const d = await res.json();
  const results: { title: string }[] = d?.query?.search ?? [];

  for (const r of results.slice(0, 3)) {
    const url = await pageImageFree(r.title);
    if (url) return url;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ url: null });

  // Try direct article title variations first (faster, no search needed)
  for (const v of [team, `${team} FC`, `FC ${team}`, `${team} F.C.`, `${team} CF`]) {
    try {
      const url = await pageImageFree(v);
      if (url) return NextResponse.json({ url });
    } catch { /* continue */ }
  }

  // Fallback: search Wikipedia for "team football club"
  try {
    const url = await searchAndGetLogo(`${team} football club`);
    if (url) return NextResponse.json({ url });
  } catch { /* continue */ }

  // Last resort: plain search
  try {
    const url = await searchAndGetLogo(team);
    if (url) return NextResponse.json({ url });
  } catch { /* continue */ }

  return NextResponse.json({ url: null });
}
