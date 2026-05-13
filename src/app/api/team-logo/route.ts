import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ url: null });

  try {
    const res = await fetch(
      `https://api.sofascore.app/api/v1/team/search?q=${encodeURIComponent(team)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "Referer": "https://www.sofascore.com/",
        },
        next: { revalidate: 86400 }, // cache 24h
      }
    );

    if (!res.ok) return NextResponse.json({ url: null });

    const data = await res.json();
    const id = data.teams?.[0]?.id;
    if (!id) return NextResponse.json({ url: null });

    return NextResponse.json({
      url: `https://api.sofascore.app/api/v1/team/${id}/image`,
    });
  } catch {
    return NextResponse.json({ url: null });
  }
}
