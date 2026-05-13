"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { BetResult } from "@/types";

const VALID_RESULTS: BetResult[] = ["home", "draw", "away"];

type PendingBet = {
  id: string;
  user_id: string;
  prediction: BetResult;
  potential_win: number;
};

type SettlementProfile = {
  user_id: string;
  points: number;
  won_bets: number;
  lost_bets: number;
};

function isValidScore(score: number | null) {
  return score === null || (Number.isInteger(score) && score >= 0);
}

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Error al resolver";
}

export async function resolveEvent(
  eventId: string,
  result: BetResult,
  homeScore: number | null,
  awayScore: number | null
) {
  if (!eventId || !VALID_RESULTS.includes(result)) {
    return { success: false, message: "Resultado inválido" };
  }

  if (!isValidScore(homeScore) || !isValidScore(awayScore)) {
    return { success: false, message: "Marcador inválido" };
  }

  const userSupabase = await createClient();
  const { data: { user }, error: userError } = await userSupabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "No autenticado" };
  }

  const { data: requesterProfile, error: requesterError } = await userSupabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();

  if (requesterError || !requesterProfile?.is_admin) {
    return { success: false, message: "No autorizado" };
  }

  const supabase = await createAdminClient();

  try {
    // Get all pending bets on this event
    const { data: betsData, error: betsError } = await supabase
      .from("bets")
      .select("id, user_id, prediction, potential_win")
      .eq("event_id", eventId)
      .eq("status", "pending");

    if (betsError) {
      console.error("Bets fetch error:", betsError);
      throw betsError;
    }

    const bets = (betsData || []) as PendingBet[];
    const profilesByUserId = new Map<string, SettlementProfile>();
    console.log(`Found ${bets.length} pending bets for event ${eventId}`);

    if (bets.length > 0) {
      const userIds = [...new Set(bets.map((bet) => bet.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, points, won_bets, lost_bets")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Profiles fetch error:", profilesError);
        throw profilesError;
      }

      for (const profile of (profilesData || []) as SettlementProfile[]) {
        profilesByUserId.set(profile.user_id, profile);
      }

      for (const bet of bets) {
        const won = bet.prediction === result;
        console.log(`Processing bet ${bet.id}: won=${won}, prediction=${bet.prediction}, result=${result}`);

        const profile = profilesByUserId.get(bet.user_id);
        if (!profile) {
          throw new Error(`Perfil no encontrado para el usuario ${bet.user_id}`);
        }

        // Update bet status
        const { error: betError } = await supabase
          .from("bets")
          .update({
            status: won ? "won" : "lost",
            resolved_at: new Date().toISOString(),
          })
          .eq("id", bet.id);

        if (betError) {
          console.error(`Bet update error for ${bet.id}:`, betError);
          throw betError;
        }

        // Update user points
        const updateData = won
          ? {
            points: profile.points + bet.potential_win,
            won_bets: profile.won_bets + 1,
          }
          : {
            lost_bets: profile.lost_bets + 1,
          };

        const { error: profileError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("user_id", bet.user_id);

        if (profileError) {
          console.error(`Profile update error for ${bet.user_id}:`, profileError);
          throw profileError;
        }

        profilesByUserId.set(bet.user_id, {
          ...profile,
          points: updateData.points ?? profile.points,
          won_bets: updateData.won_bets ?? profile.won_bets,
          lost_bets: updateData.lost_bets ?? profile.lost_bets,
        });
      }
    }

    // Update event after settling bets so the admin view does not show it as finished on partial failures.
    const { error: eventError } = await supabase.from("events").update({
      status: "finished",
      result,
      home_score: homeScore,
      away_score: awayScore,
    }).eq("id", eventId);

    if (eventError) {
      console.error("Event update error:", eventError);
      throw eventError;
    }

    revalidatePath("/admin");
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath("/dashboard");
    revalidatePath("/bets");
    revalidatePath("/events");
    revalidatePath("/profile");

    return {
      success: true,
      message: `Evento resuelto: ${bets.length} apuestas procesadas ✓`,
      betsCount: bets.length,
    };
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    console.error("Resolve event error:", message);
    return {
      success: false,
      message,
    };
  }
}
