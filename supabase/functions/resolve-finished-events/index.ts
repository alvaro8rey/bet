import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ODDS_API_KEY = Deno.env.get("ODDS_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

type BetResult = "home" | "draw" | "away";

function determineResult(homeTeam: string, scores: { name: string; score: string }[]): BetResult | null {
  const home = scores.find((s) => s.name === homeTeam);
  const away = scores.find((s) => s.name !== homeTeam);
  if (!home || !away) return null;
  const h = parseInt(home.score);
  const a = parseInt(away.score);
  if (isNaN(h) || isNaN(a)) return null;
  if (h > a) return "home";
  if (a > h) return "away";
  return "draw";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get all pending events linked to the API
    const { data: pendingEvents, error: eventsError } = await supabase
      .from("events")
      .select("id, api_event_id, api_sport_key, home_team, away_team")
      .eq("status", "pending")
      .not("api_event_id", "is", null);

    if (eventsError) throw eventsError;
    if (!pendingEvents?.length) {
      return new Response(JSON.stringify({ message: "No pending API events" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Checking ${pendingEvents.length} pending events`);

    // Group by sport key to minimize API calls
    const bySport = new Map<string, typeof pendingEvents>();
    for (const ev of pendingEvents) {
      if (!ev.api_sport_key) continue;
      if (!bySport.has(ev.api_sport_key)) bySport.set(ev.api_sport_key, []);
      bySport.get(ev.api_sport_key)!.push(ev);
    }

    const resolved: string[] = [];
    const errors: string[] = [];

    for (const [sportKey, sportEvents] of bySport) {
      // Fetch scores for this sport (last 3 days)
      const scoresRes = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/scores?apiKey=${ODDS_API_KEY}&daysFrom=3&dateFormat=iso`
      );
      if (!scoresRes.ok) {
        errors.push(`Scores fetch failed for ${sportKey}: ${scoresRes.status}`);
        continue;
      }
      const scores: any[] = await scoresRes.json();
      const scoreMap = new Map(scores.map((s) => [s.id, s]));

      for (const event of sportEvents) {
        const apiMatch = scoreMap.get(event.api_event_id);
        if (!apiMatch?.completed || !apiMatch?.scores?.length) continue;

        const result = determineResult(event.home_team, apiMatch.scores);
        if (!result) {
          errors.push(`Could not determine result for event ${event.id}`);
          continue;
        }

        const homeScore = parseInt(apiMatch.scores.find((s: any) => s.name === event.home_team)?.score ?? "0");
        const awayScore = parseInt(apiMatch.scores.find((s: any) => s.name !== event.home_team)?.score ?? "0");

        // Settle bets
        const { data: bets } = await supabase
          .from("bets")
          .select("id, user_id, prediction, potential_win")
          .eq("event_id", event.id)
          .eq("status", "pending");

        if (bets?.length) {
          const userIds = [...new Set(bets.map((b) => b.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, points, won_bets, lost_bets")
            .in("user_id", userIds);

          const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

          for (const bet of bets) {
            const won = bet.prediction === result;
            const profile = profileMap.get(bet.user_id);
            if (!profile) continue;

            await supabase.from("bets").update({
              status: won ? "won" : "lost",
              resolved_at: new Date().toISOString(),
            }).eq("id", bet.id);

            const updateData = won
              ? { points: profile.points + bet.potential_win, won_bets: profile.won_bets + 1, bankruptcy_at: null }
              : {
                  lost_bets: profile.lost_bets + 1,
                  ...(profile.points === 0 ? { bankruptcy_at: new Date().toISOString() } : {}),
                };

            await supabase.from("profiles").update(updateData).eq("user_id", bet.user_id);

            profileMap.set(bet.user_id, {
              ...profile,
              points: won ? profile.points + bet.potential_win : profile.points,
              won_bets: won ? profile.won_bets + 1 : profile.won_bets,
              lost_bets: won ? profile.lost_bets : profile.lost_bets + 1,
            });
          }
        }

        // Mark event as finished
        await supabase.from("events").update({
          status: "finished",
          result,
          home_score: isNaN(homeScore) ? null : homeScore,
          away_score: isNaN(awayScore) ? null : awayScore,
        }).eq("id", event.id);

        resolved.push(`${event.home_team} vs ${event.away_team} → ${result}`);
        console.log(`✅ Resolved: ${event.home_team} vs ${event.away_team} → ${result} (${homeScore}-${awayScore})`);
      }
    }

    return new Response(
      JSON.stringify({ resolved, errors, total_checked: pendingEvents.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
