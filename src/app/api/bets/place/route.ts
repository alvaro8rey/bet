import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { event_id, prediction, amount } = body;

  const betAmount = parseInt(amount);
  if (!event_id || !prediction || !betAmount || betAmount < 10) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  if (!["home", "draw", "away"].includes(prediction)) {
    return NextResponse.json({ error: "Predicción no válida" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Leer perfil server-side — no confiamos en el cliente
  const { data: profile } = await admin
    .from("profiles")
    .select("points, total_bets")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  if (profile.points < betAmount) return NextResponse.json({ error: "Puntos insuficientes" }, { status: 400 });

  // Verificar que no haya apuesta activa
  const { data: existing } = await admin
    .from("bets")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Ya tienes una apuesta activa" }, { status: 409 });

  // Verificar evento y cuota server-side
  const { data: event } = await admin
    .from("events")
    .select("home_odds, draw_odds, away_odds, status")
    .eq("id", event_id)
    .single();

  if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  if (event.status !== "pending") return NextResponse.json({ error: "El evento ya no acepta apuestas" }, { status: 400 });

  const odds =
    prediction === "home" ? event.home_odds :
    prediction === "draw" ? event.draw_odds :
    event.away_odds;

  if (!odds) return NextResponse.json({ error: "Cuota no disponible" }, { status: 400 });

  const potentialWin = Math.floor(betAmount * odds);

  // Crear apuesta
  const { error: betError } = await admin.from("bets").insert({
    user_id: user.id,
    event_id,
    prediction,
    amount: betAmount,
    odds,
    potential_win: potentialWin,
    status: "pending",
  });

  if (betError) {
    console.error("bet insert error:", betError);
    return NextResponse.json({ error: "Error al crear la apuesta" }, { status: 500 });
  }

  // Descontar puntos server-side
  const { error: profileError } = await admin
    .from("profiles")
    .update({ points: profile.points - betAmount, total_bets: profile.total_bets + 1 })
    .eq("user_id", user.id);

  if (profileError) {
    console.error("profile update error:", profileError);
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }

  return NextResponse.json({ success: true, potentialWin });
}
