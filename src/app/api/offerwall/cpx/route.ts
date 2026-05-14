import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

// CPX Research postback docs:
// status=1 → completed, status=2 → reversed (fraud detected)
// hash verification: MD5(trans_id + CPX_SECURITY_HASH)
// Must respond with "1" on success.

function verifyHash(transId: string, receivedHash: string): boolean {
  const key = process.env.CPX_SECURITY_HASH;
  if (!key) {
    console.error("CPX_SECURITY_HASH not configured");
    return false;
  }
  const expected = crypto
    .createHash("md5")
    .update(transId + "-" + key)
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

  if (!verifyHash(transId, hash)) {
    console.warn("CPX postback invalid hash", { transId, hash });
    return new NextResponse("invalid_hash", { status: 403 });
  }

  const amount = parseInt(amountStr, 10);
  if (isNaN(amount) || amount <= 0) {
    return new NextResponse("invalid_amount", { status: 400 });
  }

  const supabase = await createAdminClient();

  // status=2 → fraud reversal: deduct points if the transaction was previously credited
  if (status === "2") {
    const { data: existing } = await supabase
      .from("offerwall_transactions")
      .select("id, reward_points")
      .eq("transaction_id", transId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("offerwall_transactions")
        .update({ reversed: true })
        .eq("transaction_id", transId);

      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("user_id", userId)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ points: Math.max(0, profile.points - existing.reward_points) })
          .eq("user_id", userId);

        console.log(`⚠️ CPX reversal: user ${userId} -${existing.reward_points} pts (tx: ${transId})`);
      }
    }
    return new NextResponse("1", { status: 200 });
  }

  // status=1 → completed survey
  if (status !== "1") {
    return new NextResponse("1", { status: 200 });
  }

  const { error: txError } = await supabase
    .from("offerwall_transactions")
    .insert({
      user_id: userId,
      transaction_id: transId,
      reward_points: amount,
      provider: "cpx",
      reversed: false,
    });

  if (txError) {
    // 23505 = unique_violation: already processed, return success
    if (txError.code === "23505") {
      return new NextResponse("1", { status: 200 });
    }
    console.error("CPX tx insert error:", JSON.stringify(txError));
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
