import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const BANKRUPTCY_RESET_POINTS = 1000;

function isNextDay(dateStr: string): boolean {
  const bankruptDate = new Date(dateStr);
  const today = new Date();
  const bankruptDay = new Date(bankruptDate.getFullYear(), bankruptDate.getMonth(), bankruptDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return todayDay > bankruptDay;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const admin = await createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  if (profile.bankruptcy_at && isNextDay(profile.bankruptcy_at)) {
    const { data: updated } = await admin
      .from("profiles")
      .update({ points: BANKRUPTCY_RESET_POINTS, bankruptcy_at: null })
      .eq("user_id", user.id)
      .select("*")
      .single();
    return NextResponse.json({ profile: updated ?? profile });
  }

  if (profile.bankruptcy_at && profile.points > 0) {
    const { data: updated } = await admin
      .from("profiles")
      .update({ bankruptcy_at: null })
      .eq("user_id", user.id)
      .select("*")
      .single();
    return NextResponse.json({ profile: updated ?? profile });
  }

  return NextResponse.json({ profile });
}
