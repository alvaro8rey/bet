import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("is_admin").eq("user_id", userId).single();
  return !!data?.is_admin;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isAdmin(supabase, user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const admin = await createAdminClient();

  const updates: Record<string, unknown> = {};
  if (typeof body.points === "number")   updates.points   = Math.max(0, body.points);
  if (typeof body.is_admin === "boolean") updates.is_admin = body.is_admin;
  if (typeof body.username === "string" && body.username.trim()) updates.username = body.username.trim();

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { data, error } = await admin.from("profiles").update(updates).eq("user_id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isAdmin(supabase, user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === user.id) return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });

  const admin = await createAdminClient();

  // Delete profile first, then auth user
  await admin.from("profiles").delete().eq("user_id", id);
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
