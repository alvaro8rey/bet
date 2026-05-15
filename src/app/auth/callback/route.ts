import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);

    if (user) {
      const admin = await createAdminClient();

      // Create profile for new Google users if it doesn't exist
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        const rawName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "user";
        const baseUsername = rawName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "user";

        // Ensure username is unique
        let username = baseUsername;
        let attempt = 0;
        while (true) {
          const { data: taken } = await admin
            .from("profiles")
            .select("id")
            .eq("username", username)
            .maybeSingle();
          if (!taken) break;
          attempt++;
          username = `${baseUsername}${attempt}`;
        }

        await admin.from("profiles").insert({
          user_id: user.id,
          username,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          points: 1000,
          total_bets: 0,
          won_bets: 0,
          lost_bets: 0,
          is_admin: false,
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
