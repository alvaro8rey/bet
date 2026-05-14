import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Verify caller is an authenticated admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { redemptionId, reason } = await request.json();
  if (!redemptionId) {
    return NextResponse.json({ error: "Missing redemptionId" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Fetch redemption with reward and user info
  const { data: redemption, error: fetchError } = await admin
    .from("redemptions")
    .select("*, reward:rewards(puntos_necesarios, nombre)")
    .eq("id", redemptionId)
    .single();

  if (fetchError || !redemption) {
    return NextResponse.json({ error: "Redemption not found" }, { status: 404 });
  }

  if (redemption.status === "cancelled") {
    return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
  }

  // Update redemption status
  const { error: updateError } = await admin
    .from("redemptions")
    .update({ status: "cancelled" })
    .eq("id", redemptionId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }

  // Refund points to user
  const { data: userProfile } = await admin
    .from("profiles")
    .select("points")
    .eq("user_id", redemption.user_id)
    .single();

  if (userProfile && redemption.reward) {
    await admin
      .from("profiles")
      .update({ points: userProfile.points + redemption.reward.puntos_necesarios })
      .eq("user_id", redemption.user_id);
  }

  return NextResponse.json({ success: true, reason });
}
