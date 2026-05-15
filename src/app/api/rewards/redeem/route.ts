import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type RedeemRequestBody = {
  rewardId?: number;
  nombre?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  notas?: string;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function cleanOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorResponse("No autenticado", 401);
  }

  let body: RedeemRequestBody;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Solicitud inválida", 400);
  }

  const rewardId = Number(body.rewardId);
  const nombre = body.nombre?.trim();
  const email = body.email?.trim();

  if (!Number.isInteger(rewardId) || rewardId <= 0) {
    return errorResponse("Premio inválido", 400);
  }

  if (!nombre || !email) {
    return errorResponse("Por favor completa los campos requeridos", 400);
  }

  const admin = await createAdminClient();

  const { data: reward, error: rewardError } = await admin
    .from("rewards")
    .select("id, puntos_necesarios, categoria, nombre")
    .eq("id", rewardId)
    .single();

  if (rewardError || !reward) {
    return errorResponse("Premio no encontrado", 404);
  }

  const isDigital = reward.categoria === "digital";
  const direccion = cleanOptional(body.direccion);
  if (!isDigital && !direccion) {
    return errorResponse("La dirección de envío es obligatoria para premios físicos", 400);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("points")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return errorResponse("Perfil no encontrado", 404);
  }

  if (profile.points < reward.puntos_necesarios) {
    return errorResponse("No tienes suficientes puntos para este premio", 400);
  }

  const { data: redemption, error: redemptionError } = await admin
    .from("redemptions")
    .insert({
      user_id: user.id,
      reward_id: reward.id,
      nombre,
      email,
      telefono: cleanOptional(body.telefono),
      direccion,
      notas: cleanOptional(body.notas),
      status: "pending",
    })
    .select("*")
    .single();

  if (redemptionError || !redemption) {
    console.error("Redemption insert error:", redemptionError);
    return errorResponse("Error al crear el canje", 500);
  }

  const { data: updatedProfile, error: updateError } = await admin
    .from("profiles")
    .update({ points: profile.points - reward.puntos_necesarios })
    .eq("user_id", user.id)
    .eq("points", profile.points)
    .select("*")
    .single();

  if (updateError || !updatedProfile) {
    console.error("Profile update after redemption error:", updateError);
    await admin.from("redemptions").delete().eq("id", redemption.id);
    return errorResponse("Tu balance cambió. Actualiza e inténtalo de nuevo.", 409);
  }

  const { error: emailError } = await admin.functions.invoke("send-redemption-email", {
    body: {
      email,
      nombre,
      reward_nombre: reward.nombre,
      status: "pending",
      puntos: reward.puntos_necesarios,
    },
  });

  if (emailError) {
    console.error("Error sending redemption confirmation:", emailError);
  }

  return NextResponse.json({ success: true, redemption, profile: updatedProfile });
}
