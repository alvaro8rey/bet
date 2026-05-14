import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

// CPX Research sends a postback when a user completes a survey.
// Verification hash: MD5(trans_id + security_hash_key)
// Expected response on success: "1"

function verifyHash(transId: string, receivedHash: string): boolean {
  const key = process.env.CPX_SECURITY_HASH;
  if (!key) {
    console.error("CPX_SECURITY_HASH not configured");
    return false;
  }
  const expected = crypto
    .createHash("md5")
    .update(transId + key)
    .digest("hex");
  return expected === receivedHash;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const userId = searchParams.get("user_id");
  const transId = searchParams.get("trans_id");
  const amountStr = searchParams.get("amount_local");
  const hash = searchParams.get("hash");

  if (!userId || !transId || !amountStr || !hash) {
    console.warn("CPX postback missing params", Object.fromEntries(searchParams));
    return new NextResponse("missing_params", { status: 400 });
  }

  // Only credit completed surveys (status=1)
  if (status !== "1") {
    return new NextResponse("1", { status: 200 });
  }

  const amount = parseInt(amountStr, 10);
  if (isNaN(amount) || amount <= 0) {
    return new NextResponse("invalid_amount", { status: 400 });
  }

  if (!verifyHash(transId, hash)) {
    console.warn("CPX postback invalid hash", { transId, hash });
    return new NextResponse("invalid_hash", { status: 403 });
  }

  const supabase = await createAdminClient();

  // Idempotency: skip already-processed transactions
  const { data: existing } = await supabase
    .from("offerwall_transactions")
    .select("id")
    .eq("transaction_id", transId)
    .maybeSingle();

  if (existing) {
    return new NextResponse("1", { status: 200 });
  }

  const { error: txError } = await supabase
    .from("offerwall_transactions")
    .insert({
      user_id: userId,
      transaction_id: transId,
      reward_points: amount,
      provider: "cpx",
    });

  if (txError) {
    console.error("CPX tx insert error:", txError);
    return new NextResponse("db_error", { status: 500 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("points")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    console.error("CPX: user not found:", userId);
    return new NextResponse("user_not_found", { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ points: profile.points + amount, bankruptcy_at: null })
    .eq("user_id", userId);

  if (updateError) {
    console.error("CPX: points update error:", updateError);
    return new NextResponse("update_error", { status: 500 });
  }

  console.log(`✅ CPX postback: user ${userId} +${amount} pts (tx: ${transId})`);
  return new NextResponse("1", { status: 200 });
}
