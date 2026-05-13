import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

// BitLabs postback: user_id, reward (puntos), transaction_id, signature
// Signature: SHA1(transaction_id + secret_key)

function verifySignature(transactionId: string, receivedSig: string): boolean {
  const secretKey = process.env.BITLABS_SECRET_KEY;
  if (!secretKey) {
    console.error("BITLABS_SECRET_KEY no configurado");
    return false;
  }
  const expected = crypto
    .createHash("sha1")
    .update(transactionId + secretKey)
    .digest("hex");
  return expected === receivedSig;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get("user_id");
  const rewardStr = searchParams.get("reward");
  const transactionId = searchParams.get("transaction_id");
  const signature = searchParams.get("signature");

  if (!userId || !rewardStr || !transactionId || !signature) {
    console.warn("BitLabs postback con parámetros incompletos", Object.fromEntries(searchParams));
    return new NextResponse("missing_params", { status: 400 });
  }

  const reward = parseInt(rewardStr, 10);
  if (isNaN(reward) || reward <= 0) {
    return new NextResponse("invalid_reward", { status: 400 });
  }

  if (!verifySignature(transactionId, signature)) {
    console.warn("BitLabs: firma inválida", { transactionId, signature });
    return new NextResponse("invalid_signature", { status: 403 });
  }

  const supabase = await createAdminClient();

  const { data: existing } = await supabase
    .from("offerwall_transactions")
    .select("id")
    .eq("transaction_id", transactionId)
    .maybeSingle();

  if (existing) {
    return new NextResponse("already_processed", { status: 200 });
  }

  const { error: txError } = await supabase
    .from("offerwall_transactions")
    .insert({
      user_id: userId,
      transaction_id: transactionId,
      reward_points: reward,
      provider: "bitlabs",
    });

  if (txError) {
    console.error("BitLabs: error guardando transacción:", txError);
    return new NextResponse("db_error", { status: 500 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("points")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    console.error("BitLabs: usuario no encontrado:", userId);
    return new NextResponse("user_not_found", { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ points: profile.points + reward, bankruptcy_at: null })
    .eq("user_id", userId);

  if (updateError) {
    console.error("BitLabs: error actualizando puntos:", updateError);
    return new NextResponse("update_error", { status: 500 });
  }

  console.log(`✅ BitLabs postback: usuario ${userId} recibe ${reward} puntos (tx: ${transactionId})`);
  return new NextResponse("1", { status: 200 });
}
