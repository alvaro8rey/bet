import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { formatPoints } from "@/utils";
import {
  Users, Calendar, Ticket, Gift, Package,
  Download, ChevronRight, Plus, AlertTriangle,
} from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const [
    { count: usersCount },
    { count: pendingBets },
    { count: pendingEvents },
    { count: liveEvents },
    { count: pendingRedemptions },
    { count: rewardsCount },
    { data: totalPointsData },
    { data: needsResolution },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("bets").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "live"),
    supabase.from("redemptions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("rewards").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("points"),
    // Events past their date still pending
    supabase.from("events")
      .select("id, home_team, away_team, event_date")
      .eq("status", "pending")
      .lt("event_date", new Date().toISOString())
      .order("event_date", { ascending: false })
      .limit(5),
  ]);

  const totalPoints = (totalPointsData ?? []).reduce((acc: number, p: any) => acc + (p.points ?? 0), 0);

  const sections = [
    {
      href: "/admin/events",
      icon: Calendar,
      label: "Eventos",
      description: "Gestiona todos los eventos y resultados",
      badge: (pendingEvents ?? 0) + (liveEvents ?? 0),
      badgeLabel: "activos",
      color: "text-accent",
      accent: "group-hover:border-accent/40",
      quick: { href: "/admin/events/new", label: "Nuevo", icon: Plus },
    },
    {
      href: "/admin/import",
      icon: Download,
      label: "Importar partidos",
      description: "Importa eventos desde la API con cuotas reales",
      badge: null,
      color: "text-blue",
      accent: "group-hover:border-blue/40",
    },
    {
      href: "/admin/users",
      icon: Users,
      label: "Usuarios",
      description: "Consulta, ajusta puntos y gestiona admins",
      badge: usersCount ?? 0,
      badgeLabel: "registrados",
      color: "text-purple-400",
      accent: "group-hover:border-purple-400/40",
    },
    {
      href: "/admin/rewards",
      icon: Package,
      label: "Premios",
      description: "Crea y edita el catálogo de premios canjeables",
      badge: rewardsCount ?? 0,
      badgeLabel: "premios",
      color: "text-gold",
      accent: "group-hover:border-gold/40",
      quick: { href: "/admin/rewards/new", label: "Nuevo", icon: Plus },
    },
    {
      href: "/admin/redemptions",
      icon: Gift,
      label: "Canjes",
      description: "Procesa las solicitudes de canje de premios",
      badge: pendingRedemptions ?? 0,
      badgeLabel: "pendientes",
      badgeAlert: (pendingRedemptions ?? 0) > 0,
      color: "text-win",
      accent: "group-hover:border-win/40",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display font-black text-3xl text-text-primary mb-1">Panel Admin</h1>
        <p className="text-text-muted text-sm">Gestión completa de SharpBet</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-text-muted text-xs mb-1">Usuarios</p>
          <p className="text-text-primary font-bold text-2xl">{usersCount ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-text-muted text-xs mb-1">Apuestas activas</p>
          <p className="text-pending font-bold text-2xl">{pendingBets ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-text-muted text-xs mb-1">Canjes pendientes</p>
          <p className={`font-bold text-2xl ${(pendingRedemptions ?? 0) > 0 ? "text-loss" : "text-text-primary"}`}>
            {pendingRedemptions ?? 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-text-muted text-xs mb-1">Pts en circulación</p>
          <p className="text-accent font-bold text-xl">{formatPoints(totalPoints)}</p>
        </Card>
      </div>

      {/* Alert: events needing resolution */}
      {(needsResolution?.length ?? 0) > 0 && (
        <div className="bg-pending/10 border border-pending/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-pending flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-pending font-semibold text-sm mb-2">
                {needsResolution!.length} evento{needsResolution!.length > 1 ? "s" : ""} sin resolver
              </p>
              <div className="space-y-1">
                {needsResolution!.map((e: any) => (
                  <Link
                    key={e.id}
                    href={`/admin/events/${e.id}`}
                    className="flex items-center justify-between text-xs text-text-secondary hover:text-accent transition py-0.5"
                  >
                    <span className="truncate">{e.home_team} vs {e.away_team}</span>
                    <ChevronRight size={12} className="flex-shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
              {(pendingEvents ?? 0) > 5 && (
                <Link href="/admin/events" className="text-xs text-pending/70 hover:text-pending transition mt-1 block">
                  Ver todos →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.href} className={`group p-5 transition-all hover:border-border/80 ${s.accent} cursor-pointer`}>
              <Link href={s.href} className="flex items-start gap-4">
                <div className={`mt-0.5 flex-shrink-0 ${s.color}`}>
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-text-primary font-semibold">{s.label}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {s.badge !== null && s.badge !== undefined && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          (s as any).badgeAlert
                            ? "bg-loss/15 text-loss"
                            : "bg-surface-3 text-text-muted"
                        }`}>
                          {s.badge} {(s as any).badgeLabel}
                        </span>
                      )}
                      <ChevronRight size={16} className="text-text-muted group-hover:text-accent transition" />
                    </div>
                  </div>
                  <p className="text-text-muted text-xs mt-1">{s.description}</p>
                </div>
              </Link>
              {(s as any).quick && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Link
                    href={(s as any).quick.href}
                    className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition font-medium"
                  >
                    <Plus size={12} />
                    {(s as any).quick.label}
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
