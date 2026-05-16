import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = await createAdminClient();

  const { data: authUser, error: userError } = await admin.auth.admin.getUserById(id);
  if (userError || !authUser.user?.email) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const origin = request.nextUrl.origin;
  const { error } = await supabase.auth.resetPasswordForEmail(authUser.user.email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
