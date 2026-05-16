import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const origin = request.nextUrl.origin;

  const redirectTo = new URL("/dashboard", origin);

  if (!code) return NextResponse.redirect(redirectTo);

  // Build response first so we can set cookies on it
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  // Create profile for new Google users
  const admin = await createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const rawName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "user";
    const baseUsername = rawName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "user";

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

    // Apply referral if code stored in cookie
    const refCode = request.cookies.get("ref_code")?.value;
    if (refCode) {
      await fetch(`${origin}/api/referral/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_code: refCode, new_user_id: user.id }),
      }).catch(() => {});
      response.cookies.delete("ref_code");
    }
  }

  return response;
}
