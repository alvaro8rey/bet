import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

// Hash = HMAC-SHA1(secret, fullUrlWithoutHashParam), base64url-encoded
// + → -   / → _   = → ""

function verifyHash(received: string, fullUrl: string): boolean {
  const secret = process.env.THEOREM_REACH_SECRET;
  if (!secret) {
    console.error("THEOREM_REACH_SECRET not configured");
    return false;
  }

  // Remove &hash=... or ?hash=... from URL before hashing
  const urlWithoutHash = fullUrl
    .replace(/&hash=[^&]+/, "")
    .replace(/\?hash=[^&]+&?/, "?");

  const raw = crypto.createHmac("sha1", secret).update(urlWithoutHash).digest("base64");
  const encoded = raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

  console.log(`TR hash check — expected: ${encoded} received: ${received}`);
  return encoded === received;
}

export async function GET(request: NextRequest) {
  const parsed = new URL(request.url);
  const { searchParams } = parsed;

  const userId = searchParams.get("user_id");
  const reward = searchParams.get("reward");
  const txId = searchParams.get("tx_id");
  const status = searchParams.get("status");
  const hash = searchParams.get("hash");

  if (!userId || !reward || !txId) {
    console.warn("TheoremReach postback missing params", Object.fromEntries(searchParams));
    return new NextResponse("missing_params", { status: 400 });
  }

  // status=1 completed — only credit status=1
  if (status !== "1") {
    return new NextResponse("1", { status: 200 });
  }

  // Hash verification
  if (!hash) {
    console.warn("TheoremReach: missing hash, rejecting");
    return new NextResponse("invalid_hash", { status: 403 });
  }
  if (!verifyHash(hash, parsed.toString())) {
    console.warn("TheoremReach hash mismatch:", { txId, hash });
    return new NextResponse("invalid_hash", { status: 403 });
  }

  const amount = Math.round(parseFloat(reward));
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

  console.log(`✅ TheoremReach: user ${userId} +${amount} pts (tx: ${txId})`);
  return new NextResponse("1", { status: 200 });
}
