"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActiveBet } from "@/hooks/useActiveBet";
import { cn } from "@/utils";
import { LayoutDashboard, Calendar, Ticket, Trophy, Gift, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/events", icon: Calendar, label: "Eventos" },
  { href: "/bets", icon: Ticket, label: "Apuestas" },
  { href: "/leaderboard", icon: Trophy, label: "Ranking" },
  { href: "/rewards", icon: Gift, label: "Premios" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { activeBet } = useActiveBet();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-border">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200",
                active ? "text-accent" : "text-text-muted"
              )}
            >
              <div className="relative">
                <Icon size={20} />
                {item.href === "/bets" && activeBet && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-pending rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
