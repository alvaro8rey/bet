"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useActiveBet } from "@/hooks/useActiveBet";
import { formatPoints } from "@/utils";
import { cn } from "@/utils";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Trophy,
  Gift,
  User,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/events", icon: Calendar, label: "Eventos" },
  { href: "/bets", icon: Ticket, label: "Mis Apuestas" },
  { href: "/leaderboard", icon: Trophy, label: "Clasificación" },
  { href: "/rewards", icon: Gift, label: "Premios" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const { activeBet } = useActiveBet();

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-16 bottom-0 bg-surface border-r border-border overflow-y-auto">
      {/* Points card */}
      <div className="p-4">
        <div className="bg-gradient-radial from-accent-muted to-surface-2 border border-accent/20 rounded-2xl p-4">
          <p className="text-text-muted text-xs font-medium mb-1">Balance actual</p>
          <div className="flex items-end gap-1">
            <span className="text-accent font-bold text-2xl">{profile ? formatPoints(profile.points) : "—"}</span>
            <span className="text-accent/60 text-sm mb-0.5">pts</span>
          </div>
          {activeBet && (
            <div className="mt-3 pt-3 border-t border-accent/10">
              <p className="text-xs text-pending font-medium">🎯 Apuesta activa: {activeBet.amount} pts</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                    active
                      ? "bg-accent-muted text-accent border border-accent/20"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                  )}
                >
                  <Icon size={18} className={cn(active ? "text-accent" : "text-text-muted group-hover:text-text-secondary")} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.href === "/bets" && activeBet && (
                    <span className="ml-auto w-2 h-2 bg-pending rounded-full animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}

          {profile?.is_admin && (
            <li className="pt-2 mt-2 border-t border-border">
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  pathname.startsWith("/admin")
                    ? "bg-blue-muted text-blue border border-blue/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                )}
              >
                <Settings size={18} />
                <span className="text-sm font-medium">Admin</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Bottom user info */}
      {profile && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-accent to-blue rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-background text-sm font-bold">
                {profile.username?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-text-primary text-sm font-medium truncate">{profile.username}</p>
              <p className="text-text-muted text-xs">{profile.won_bets}/{profile.total_bets} ganadas</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
