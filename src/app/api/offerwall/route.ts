import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

// Monlix envía un postback cuando el usuario completa una oferta.
// Parámetros que llegan: user_id, reward (puntos), transaction_id, hash
// El hash se verifica con: md5(transaction_id + secret_key)

function verifyHash(transactionId: string, receivedHash: string): boolean {
  const secretKey = process.env.MONLIX_SECRET_KEY;
  if (!secretKey) {
    console.error("MONLIX_SECRET_KEY no configurado");
    return false;
  }
  const expected = crypto
    .createHash("md5")
    .update(transactionId + secretKey)
    .digest("hex");
  return expected === receivedHash;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get("user_id");
  const rewardStr = searchParams.get("reward");
  const transactionId = searchParams.get("transaction_id");
  const hash = searchParams.get("hash");

  // Validar parámetros obligatorios
  if (!userId || !rewardStr || !transactionId || !hash) {
    console.warn("Postback con parámetros incompletos", Object.fromEntries(searchParams));
    return new NextResponse("missing_params", { status: 400 });
  }

  const reward = parseInt(rewardStr, 10);
  if (isNaN(reward) || reward <= 0) {
    return new NextResponse("invalid_reward", { status: 400 });
  }

  // Verificar hash para evitar fraude
  if (!verifyHash(transactionId, hash)) {
    console.warn("Postback con hash inválido, posible fraude", { transactionId, hash });
    return new NextResponse("invalid_hash", { status: 403 });
  }

  const supabase = await createAdminClient();

  // Evitar procesar la misma transacción dos veces
  const { data: existing } = await supabase
    .from("offerwall_transactions")
    .select("id")
    .eq("transaction_id", transactionId)
    .maybeSingle();

  if (existing) {
    return new NextResponse("already_processed", { status: 200 });
  }

  // Registrar la transacción
  const { error: txError } = await supabase
    .from("offerwall_transactions")
    .insert({
      user_id: userId,
      transaction_id: transactionId,
      reward_points: reward,
      provider: "monlix",
    });

  if (txError) {
    console.error("Error guardando transacción:", txError);
    return new NextResponse("db_error", { status: 500 });
  }

  // Acreditar puntos al usuario
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("points, bankruptcy_at")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    console.error("Usuario no encontrado:", userId);
    return new NextResponse("user_not_found", { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      points: profile.points + reward,
      // Si recibe puntos, salir de bancarrota
      bankruptcy_at: null,
    })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error actualizando puntos:", updateError);
    return new NextResponse("update_error", { status: 500 });
  }

  console.log(`✅ Postback procesado: usuario ${userId} recibe ${reward} puntos (tx: ${transactionId})`);
  // Monlix espera "1" como respuesta de éxito
  return new NextResponse("1", { status: 200 });
}
