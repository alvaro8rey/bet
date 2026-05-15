import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

// BitLabs postback: HMAC-SHA1 of the full URL (without &hash=...) using the app secret key, hex-encoded.
// Params: uid, val (reward points), hash
// Must respond 200 on success.

function verifyHash(received: string, parsed: URL): boolean {
  const secret = process.env.BITLABS_SECRET_KEY;
  if (!secret) {
    console.error("BITLABS_SECRET_KEY not configured");
    return false;
  }
  // Remove ALL hash params and debug param before hashing
  const clean = new URL(parsed.toString());
  clean.searchParams.delete("hash");
  clean.searchParams.delete("debug");
  const urlWithoutHash = clean.toString();

  const expected = crypto.createHmac("sha1", secret).update(urlWithoutHash).digest("hex");
  console.log(`BitLabs hash check — expected: ${expected} received: ${received}`);
  return expected === received;
}

export async function GET(request: NextRequest) {
  const parsed = new URL(request.url);
  const { searchParams } = parsed;

  const uid = searchParams.get("uid");
  const val = searchParams.get("val");
  // BitLabs may send duplicate hash params — take the last (real) one
  const hashes = searchParams.getAll("hash");
  const hash = hashes[hashes.length - 1] ?? null;
  const txId = searchParams.get("transaction_id") ?? searchParams.get("tid") ?? `${val}_${uid}_${Date.now()}`;

  if (!uid || !val) {
    console.warn("BitLabs postback missing params", Object.fromEntries(searchParams));
    return new NextResponse("missing_params", { status: 400 });
  }

  if (!hash) {
    console.warn("BitLabs: missing hash, rejecting");
    return new NextResponse("invalid_hash", { status: 403 });
  }

  if (!verifyHash(hash, parsed)) {
    console.warn("BitLabs hash mismatch:", { uid, txId, hash });
    return new NextResponse("invalid_hash", { status: 403 });
  }

  const amount = Math.round(parseFloat(val));
  if (isNaN(amount) || amount === 0) {
    return new NextResponse("invalid_amount", { status: 400 });
  }

  const supabase = await createAdminClient();

  // Negative val = reversal
  if (amount < 0) {
    const absAmount = Math.abs(amount);
    const { data: existing } = await supabase
      .from("offerwall_transactions")
      .select("id, reward_points")
      .eq("transaction_id", txId)
      .eq("provider", "bitlabs")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("offerwall_transactions")
        .update({ reversed: true })
        .eq("transaction_id", txId);

      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("user_id", uid)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ points: Math.max(0, profile.points - absAmount) })
          .eq("user_id", uid);
        console.log(`⚠️ BitLabs reversal: user ${uid} -${absAmount} pts (tx: ${txId})`);
      }
    }
    return new NextResponse("OK", { status: 200 });
  }

  const { error: txError } = await supabase
    .from("offerwall_transactions")
    .insert({
      user_id: uid,
      transaction_id: txId,
      reward_points: amount,
      provider: "bitlabs",
      reversed: false,
    });

  if (txError) {
    if (txError.code === "23505") return new NextResponse("OK", { status: 200 });
    console.error("BitLabs tx insert error:", JSON.stringify(txError));
    return new NextResponse("db_error", { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("user_id", uid)
    .single();

  if (!profile) {
    console.error("BitLabs: user not found:", uid);
    return new NextResponse("user_not_found", { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ points: profile.points + amount, bankruptcy_at: null })
    .eq("user_id", uid);

  if (updateError) {
    console.error("BitLabs: points update error:", updateError);
    return new NextResponse("update_error", { status: 500 });
  }

  console.log(`✅ BitLabs postback: user ${uid} +${amount} pts (tx: ${txId})`);
  return new NextResponse("OK", { status: 200 });
}
