import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Vercel sends this header to verify the request comes from their cron system
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/resolve-finished-events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    console.log("resolve-finished-events result:", data);

    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
