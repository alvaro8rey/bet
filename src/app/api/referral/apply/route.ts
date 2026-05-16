import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const REFERRAL_BONUS = 500;

export async function POST(req: NextRequest) {
  const { referral_code, new_user_id } = await req.json();
  if (!referral_code || !new_user_id) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Find referrer by code
  const { data: referrer } = await admin
    .from("profiles")
    .select("user_id, points, referral_count")
    .eq("referral_code", referral_code.toUpperCase())
    .maybeSingle();

  if (!referrer) {
    return NextResponse.json({ error: "Código no válido" }, { status: 404 });
  }

  // Can't refer yourself
  if (referrer.user_id === new_user_id) {
    return NextResponse.json({ error: "No puedes usar tu propio código" }, { status: 400 });
  }

  // Check new user hasn't already been referred
  const { data: newUserProfile } = await admin
    .from("profiles")
    .select("points, referred_by")
    .eq("user_id", new_user_id)
    .single();

  if (!newUserProfile) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (newUserProfile.referred_by) return NextResponse.json({ error: "Ya usaste un código" }, { status: 400 });

  // Give bonus to new user + mark as referred
  await admin
    .from("profiles")
    .update({ points: newUserProfile.points + REFERRAL_BONUS, referred_by: referrer.user_id })
    .eq("user_id", new_user_id);

  // Give bonus to referrer + increment count
  await admin
    .from("profiles")
    .update({ points: referrer.points + REFERRAL_BONUS, referral_count: referrer.referral_count + 1 })
    .eq("user_id", referrer.user_id);

  console.log(`✅ Referral: ${referrer.user_id} referred ${new_user_id} (+${REFERRAL_BONUS} pts each)`);
  return NextResponse.json({ success: true, bonus: REFERRAL_BONUS });
}
