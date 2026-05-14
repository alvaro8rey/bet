import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

// Theorem Reach postback verification:
// signature = HMAC-SHA1(secret, api_key + user_id + reward_amount + transaction_id)

function verifySignature(userId: string, rewardAmount: string, transactionId: string, received: string): boolean {
  const apiKey = process.env.THEOREM_REACH_API_KEY;
  const secret = process.env.THEOREM_REACH_SECRET;
  if (!apiKey || !secret) {
    console.error("THEOREM_REACH_API_KEY or THEOREM_REACH_SECRET not configured");
    return false;
  }
  const payload = apiKey + userId + rewardAmount + transactionId;
  const expected = crypto.createHmac("sha1", secret).update(payload).digest("hex");
  return expected === received;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get("user_id");
  const rewardAmount = searchParams.get("reward_amount");
  const transactionId = searchParams.get("transaction_id");
  const signature = searchParams.get("signature");

  if (!userId || !rewardAmount || !transactionId || !signature) {
    console.warn("TheoremReach postback missing params", Object.fromEntries(searchParams));
    return new NextResponse("missing_params", { status: 400 });
  }

  if (!verifySignature(userId, rewardAmount, transactionId, signature)) {
    console.warn("TheoremReach invalid signature", { transactionId, signature });
    return new NextResponse("invalid_signature", { status: 403 });
  }

  const amount = Math.round(parseFloat(rewardAmount));
  if (isNaN(amount) || amount <= 0) {
    return new NextResponse("invalid_amount", { status: 400 });
  }

  const supabase = await createAdminClient();

  const { error: txError } = await supabase
    .from("offerwall_transactions")
    .insert({
      user_id: userId,
      transaction_id: transactionId,
      reward_points: amount,
      provider: "theoremreach",
      reversed: false,
    });

  if (txError) {
    if (txError.code === "23505") {
      return new NextResponse("1", { status: 200 });
    }
    console.error("TheoremReach tx insert error:", JSON.stringify(txError));
    return new NextResponse("db_error", { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    console.error("TheoremReach: user not found:", userId);
    return new NextResponse("user_not_found", { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ points: profile.points + amount, bankruptcy_at: null })
    .eq("user_id", userId);

  if (updateError) {
    console.error("TheoremReach points update error:", updateError);
    return new NextResponse("update_error", { status: 500 });
  }

  console.log(`✅ TheoremReach postback: user ${userId} +${amount} pts (tx: ${transactionId})`);
  return new NextResponse("1", { status: 200 });
}
