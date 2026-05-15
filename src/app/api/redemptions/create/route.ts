import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { reward_id, nombre, email, telefono, direccion, notas } = body;

  if (!reward_id || !nombre || !email) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Leer premio server-side
  const { data: reward } = await admin
    .from("rewards")
    .select("id, nombre, puntos_necesarios, categoria")
    .eq("id", reward_id)
    .single();

  if (!reward) return NextResponse.json({ error: "Premio no encontrado" }, { status: 404 });

  if (reward.categoria === "fisico" && !direccion) {
    return NextResponse.json({ error: "Dirección obligatoria para premios físicos" }, { status: 400 });
  }

  // Leer perfil server-side — no confiamos en el cliente
  const { data: profile } = await admin
    .from("profiles")
    .select("points")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  if (profile.points < reward.puntos_necesarios) {
    return NextResponse.json({ error: "Puntos insuficientes" }, { status: 400 });
  }

  // Crear canje
  const { error: redemptionError } = await admin.from("redemptions").insert({
    user_id: user.id,
    reward_id: reward.id,
    nombre,
    email,
    telefono: telefono || null,
    direccion: direccion || null,
    notas: notas || null,
    status: "pending",
  });

  if (redemptionError) {
    console.error("redemption insert error:", redemptionError);
    return NextResponse.json({ error: "Error al crear el canje" }, { status: 500 });
  }

  // Descontar puntos server-side
  const { error: updateError } = await admin
    .from("profiles")
    .update({ points: profile.points - reward.puntos_necesarios })
    .eq("user_id", user.id);

  if (updateError) {
    console.error("points update error:", updateError);
    return NextResponse.json({ error: "Error al descontar puntos" }, { status: 500 });
  }

  // Email de confirmación (fire & forget)
  admin.functions.invoke("send-redemption-email", {
    body: {
      email,
      nombre,
      reward_nombre: reward.nombre,
      status: "pending",
      puntos: reward.puntos_necesarios,
    },
  }).catch((err: unknown) => console.error("send-redemption-email error:", err));

  return NextResponse.json({ success: true });
}
