import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { calculatePotentialWin } from "@/utils";
import type { BetResult } from "@/types";

const VALID_PREDICTIONS: BetResult[] = ["home", "draw", "away"];

type WagerEvent = {
  id: string;
  status: string;
  event_date: string;
  home_odds: number | string;
  draw_odds: number | string | null;
  away_odds: number | string;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getOddsForPrediction(event: WagerEvent, prediction: BetResult): number | null {
  if (prediction === "home") return Number(event.home_odds);
  if (prediction === "away") return Number(event.away_odds);
  return event.draw_odds === null ? null : Number(event.draw_odds);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorResponse("No autenticado", 401);
  }

  let body: { eventId?: string; prediction?: BetResult; amount?: number };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Solicitud inválida", 400);
  }

  const amount = Number(body.amount);
  if (!body.eventId || !body.prediction || !VALID_PREDICTIONS.includes(body.prediction)) {
    return errorResponse("Apuesta inválida", 400);
  }

  if (!Number.isInteger(amount) || amount < 10) {
    return errorResponse("La apuesta mínima es 10 puntos", 400);
  }

  const admin = await createAdminClient();

  const { data: event, error: eventError } = await admin
    .from("events")
    .select("id, status, event_date, home_odds, draw_odds, away_odds")
    .eq("id", body.eventId)
    .single();

  if (eventError || !event) {
    return errorResponse("Evento no encontrado", 404);
  }

  if (!["pending", "live"].includes(event.status) || new Date(event.event_date) <= new Date()) {
    return errorResponse("Este evento ya no acepta apuestas", 400);
  }

  const odds = getOddsForPrediction(event, body.prediction);
  if (!odds || odds <= 1) {
    return errorResponse("Predicción no disponible para este evento", 400);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("points, total_bets")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return errorResponse("Perfil no encontrado", 404);
  }

  if (amount > profile.points) {
    return errorResponse("No tienes suficientes puntos", 400);
  }

  const potentialWin = calculatePotentialWin(amount, odds);
  const { data: bet, error: betError } = await admin
    .from("bets")
    .insert({
      user_id: user.id,
      event_id: event.id,
      prediction: body.prediction,
      amount,
      odds,
      potential_win: potentialWin,
      status: "pending",
    })
    .select("*")
    .single();

  if (betError) {
    if (betError.code === "23505") {
      return errorResponse("Ya tienes una apuesta activa. Espera a que se resuelva.", 409);
    }
    console.error("Bet insert error:", betError);
    return errorResponse("Error al crear la apuesta", 500);
  }

  const { data: updatedProfile, error: updateError } = await admin
    .from("profiles")
    .update({
      points: profile.points - amount,
      total_bets: profile.total_bets + 1,
    })
    .eq("user_id", user.id)
    .eq("points", profile.points)
    .select("*")
    .single();

  if (updateError || !updatedProfile) {
    console.error("Profile update after bet error:", updateError);
    await admin.from("bets").delete().eq("id", bet.id);
    return errorResponse("Tu balance cambió. Actualiza e inténtalo de nuevo.", 409);
  }

  return NextResponse.json({ success: true, bet, profile: updatedProfile });
}
