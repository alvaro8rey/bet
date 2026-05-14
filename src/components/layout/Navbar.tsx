"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { formatPoints } from "@/utils";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import { Avatar } from "@/components/ui/Avatar";

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
        <Link href={profile ? "/dashboard" : "/"}>
          <Image src="/logo-horizontal.png" alt="SharpBet" width={140} height={40} className="h-9 w-auto" priority />
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
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar username={profile.username} avatarUrl={profile.avatar_url} size="sm" isMe className="rounded-full" />
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
