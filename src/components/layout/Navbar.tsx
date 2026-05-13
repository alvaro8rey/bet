"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { formatPoints } from "@/utils";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import toast from "react-hot-toast";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useProfile();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.push("/auth/login");
    router.refresh();
  };

  const isAuth = pathname.startsWith("/auth");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href={profile ? "/dashboard" : "/"} className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-accent-sm">
            <span className="text-background font-display font-black text-lg leading-none">P</span>
          </div>
          <span className="font-display font-bold text-xl tracking-wide text-text-primary">
            Playful<span className="text-accent">Bet</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {!isAuth && profile && (
            <>
              {/* Points badge */}
              <div className="hidden sm:flex items-center gap-2 bg-accent-muted border border-accent/20 rounded-xl px-3 py-2">
                <span className="text-accent text-xs font-medium">💎</span>
                <span className="text-accent font-bold text-sm">{formatPoints(profile.points)}</span>
                <span className="text-accent/60 text-xs">pts</span>
              </div>

              {/* Profile */}
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-blue rounded-full flex items-center justify-center">
                  <span className="text-background text-xs font-bold">
                    {profile.username?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <span className="hidden md:block text-sm text-text-secondary">{profile.username}</span>
              </Link>

              {/* Admin badge */}
              {profile.is_admin && (
                <Link href="/admin">
                  <Button variant="secondary" size="sm">Admin</Button>
                </Link>
              )}

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Salir
              </Button>
            </>
          )}

          {loading && !isAuth && <Spinner size="sm" />}

          {isAuth && (
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">Registrarse</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
