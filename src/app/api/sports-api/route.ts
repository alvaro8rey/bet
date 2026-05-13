import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const API_KEY = process.env.ODDS_API_KEY;
const BASE = "https://api.the-odds-api.com/v4";

// Sports we support, mapped to our internal type
const SPORT_FILTER: Record<string, string> = {
  soccer: "football",
  basketball: "basketball",
  tennis: "tennis",
};

function ourSportType(sportKey: string): string {
  for (const [prefix, type] of Object.entries(SPORT_FILTER)) {
    if (sportKey.startsWith(prefix)) return type;
  }
  return "other";
}

function avgOdds(bookmakers: any[], teamName: string): number | null {
  const prices: number[] = bookmakers.flatMap((b: any) =>
    (b.markets?.[0]?.outcomes ?? [])
      .filter((o: any) => o.name === teamName)
      .map((o: any) => o.price as number)
  );
  if (!prices.length) return null;
  return Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
}

async function oddsApiFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Odds API error ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  // Verify admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!API_KEY) return NextResponse.json({ error: "ODDS_API_KEY not configured" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const sport = searchParams.get("sport");

  try {
    if (action === "sports") {
      const data = await oddsApiFetch(`/sports?apiKey=${API_KEY}`);
      const filtered = (data as any[]).filter(
        (s: any) => s.active && Object.keys(SPORT_FILTER).some((p) => s.key.startsWith(p))
      );
      return NextResponse.json(filtered);
    }

    if (action === "odds" && sport) {
      const data = await oddsApiFetch(
        `/sports/${sport}/odds?apiKey=${API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal&dateFormat=iso`
      );
      const events = (data as any[]).map((e: any) => {
        const homeOdds = avgOdds(e.bookmakers, e.home_team);
        const awayOdds = avgOdds(e.bookmakers, e.away_team);
        const drawOdds = avgOdds(e.bookmakers, "Draw");
        return {
          api_id: e.id,
          sport_key: e.sport_key,
          sport_title: e.sport_title,
          home_team: e.home_team,
          away_team: e.away_team,
          commence_time: e.commence_time,
          home_odds: homeOdds,
          away_odds: awayOdds,
          draw_odds: drawOdds,
          our_sport: ourSportType(e.sport_key),
          bookmakers_count: e.bookmakers.length,
        };
      }).filter((e) => e.home_odds && e.away_odds);
      return NextResponse.json(events);
    }

    if (action === "scores" && sport) {
      const data = await oddsApiFetch(
        `/sports/${sport}/scores?apiKey=${API_KEY}&daysFrom=3&dateFormat=iso`
      );
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Sports API error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
