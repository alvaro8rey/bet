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

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorResponse("No autenticado", 401);
  }

  const admin = await createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return errorResponse("Perfil no encontrado", 404);
  }

  if (!profile.bankruptcy_at) {
    return NextResponse.json({ profile });
  }

  const updateData =
    isNextDay(profile.bankruptcy_at)
      ? { points: BANKRUPTCY_RESET_POINTS, bankruptcy_at: null }
      : profile.points > 0
        ? { bankruptcy_at: null }
        : null;

  if (!updateData) {
    return NextResponse.json({ profile });
  }

  const { data: updated, error: updateError } = await admin
    .from("profiles")
    .update(updateData)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("Bankruptcy reset error:", updateError);
    return errorResponse("Error al actualizar la bancarrota", 500);
  }

  return NextResponse.json({ profile: updated });
}
