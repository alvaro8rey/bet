import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

// AdGem postback: HMAC-SHA256 of the full URL without the verifier param, using the postback secret key.
// Params: user_id, amount, transaction_id, request_id, verifier
// Must respond 200 on success.

function verifyHash(received: string, rawUrl: string): boolean {
  const secret = process.env.ADGEM_POSTBACK_KEY;
  if (!secret) {
    console.error("ADGEM_POSTBACK_KEY not configured");
    return false;
  }
  const decoded = decodeURIComponent(rawUrl);
  const clean = decoded
    .replace(/([?&])verifier=[^&]*/g, "$1")
    .replace(/[?&]{2,}/g, "&")
    .replace(/[?&]$/, "")
    .replace(/\?&/, "?");

  const expected = crypto.createHmac("sha256", secret).update(clean).digest("hex");
  console.log(`AdGem hash check — url: ${clean} expected: ${expected} received: ${received}`);
  return expected === received;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get("user_id");
  const amountStr = searchParams.get("amount");
  const txId = searchParams.get("transaction_id") ?? searchParams.get("request_id");
  const verifier = searchParams.get("verifier");

  if (!userId || !amountStr || !txId) {
    console.warn("AdGem postback missing params", Object.fromEntries(searchParams));
    return new NextResponse("missing_params", { status: 400 });
  }

  if (!verifier) {
    console.warn("AdGem: missing verifier, rejecting");
    return new NextResponse("invalid_hash", { status: 403 });
  }

  if (!verifyHash(verifier, request.url)) {
    console.warn("AdGem hash mismatch:", { userId, txId, verifier });
    return new NextResponse("invalid_hash", { status: 403 });
  }

  const amount = Math.round(parseFloat(amountStr));
  if (isNaN(amount) || amount <= 0) {
    return new NextResponse("invalid_amount", { status: 400 });
  }

  const supabase = await createAdminClient();

  const { error: txError } = await supabase
    .from("offerwall_transactions")
    .insert({
      user_id: userId,
      transaction_id: txId,
      reward_points: amount,
      provider: "adgem",
      reversed: false,
    });

  if (txError) {
    if (txError.code === "23505") return new NextResponse("OK", { status: 200 });
    console.error("AdGem tx insert error:", JSON.stringify(txError));
    return new NextResponse("db_error", { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    console.error("AdGem: user not found:", userId);
    return new NextResponse("user_not_found", { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ points: profile.points + amount, bankruptcy_at: null })
    .eq("user_id", userId);

  if (updateError) {
    console.error("AdGem: points update error:", updateError);
    return new NextResponse("update_error", { status: 500 });
  }

  console.log(`✅ AdGem postback: user ${userId} +${amount} pts (tx: ${txId})`);
  return new NextResponse("OK", { status: 200 });
}
