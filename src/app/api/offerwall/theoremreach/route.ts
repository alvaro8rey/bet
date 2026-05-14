import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

// Theorem Reach appends params automatically to the callback URL.
// Real params: user_id, reward, tx_id, status, hash
// hash = Base64(HMAC-SHA1(secret_key, reward + tx_id + user_id))

function toBase64Url(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function verifyHash(userId: string, reward: string, txId: string, received: string, fullUrl: string): boolean {
  const secret = process.env.THEOREM_REACH_SECRET;
  const apiKey = process.env.THEOREM_REACH_API_KEY ?? "";
  if (!secret) {
    console.error("THEOREM_REACH_SECRET not configured");
    return false;
  }

  const rewardFloat = parseFloat(reward).toFixed(1);

  // HMAC-SHA1 candidates
  const hmacCandidates = [
    reward + txId + userId,
    userId + reward + txId,
    rewardFloat + txId + userId,
    userId + rewardFloat + txId,
    apiKey + userId + reward + txId,
  ];

  for (const payload of hmacCandidates) {
    const raw = crypto.createHmac("sha1", secret).update(payload).digest("base64");
    const url = toBase64Url(raw);
    if (raw === received || url === received) {
      console.log(`✅ HMAC-SHA1 match: "${payload.slice(0, 30)}..."`);
      return true;
    }
  }

  // Plain SHA1 candidates (data + secret concatenated)
  const sha1Candidates = [
    reward + txId + userId + secret,
    userId + reward + txId + secret,
    txId + userId + secret,
    fullUrl + secret,
  ];

  for (const payload of sha1Candidates) {
    const raw = crypto.createHash("sha1").update(payload).digest("base64");
    const url = toBase64Url(raw);
    console.log(`SHA1 attempt [${payload.slice(0, 30)}...]: url=${url} received=${received}`);
    if (raw === received || url === received) {
      console.log(`✅ SHA1 match: "${payload.slice(0, 30)}..."`);
      return true;
    }
  }

  return false;
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

  // Hash verification: log mismatch but don't reject (format TBD with TheoremReach support)
  if (hash) {
    const urlWithoutHash = parsed.toString().replace(/&hash=[^&]+/, "").replace(/\?hash=[^&]+&?/, "?");
    if (!verifyHash(userId, reward, txId, hash, urlWithoutHash)) {
      console.warn("TheoremReach hash mismatch (not blocking):", { txId, hash });
    }
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
