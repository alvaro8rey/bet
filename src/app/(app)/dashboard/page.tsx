import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { BankruptcyBanner } from "@/components/dashboard/BankruptcyBanner";
import { formatPoints, formatOdds, getSportIcon, getPredictionLabel } from "@/utils";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TrendingUp, TrendingDown, Ticket, Target } from "lucide-react";
import type { Event, Profile } from "@/types";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: activeBet } = await supabase
    .from("bets")
    .select("*, event:events(*)")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  const { data: recentBets } = await supabase
    .from("bets")
    .select("*, event:events(*)")
    .eq("user_id", user.id)
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .eq("status", "pending")
    .gt("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(4);

  const winRate = profile && profile.total_bets > 0
    ? Math.round((profile.won_bets / profile.total_bets) * 100)
    : 0;

  return (
      <div className="space-y-6 animate-fade-in">
        <OnboardingModal username={profile?.username} onboardingDone={profile?.onboarding_done ?? false} />
        {/* Welcome */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-black text-3xl text-text-primary mb-1">
              Hola, {profile?.username} 👋
            </h1>
            <p className="text-text-muted text-sm">
              Tu resumen de predicciones · {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          {profile?.is_admin && (
            <Link href="/admin">
              <Badge variant="pending">Admin</Badge>
            </Link>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/earn">
            <Card className="p-4 hover:border-accent/40 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center">
                  <span className="text-accent text-sm">💎</span>
                </div>
                <span className="text-text-muted text-xs">Puntos</span>
              </div>
              <p className="text-accent font-bold text-2xl">{formatPoints(profile?.points || 0)}</p>
            </Card>
          </Link>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-muted rounded-lg flex items-center justify-center">
                <Ticket size={16} className="text-blue" />
              </div>
              <span className="text-text-muted text-xs">Total apuestas</span>
            </div>
            <p className="text-text-primary font-bold text-2xl">{profile?.total_bets || 0}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-win/10 rounded-lg flex items-center justify-center">
                <TrendingUp size={16} className="text-win" />
              </div>
              <span className="text-text-muted text-xs">Ganadas</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-win font-bold text-2xl">{profile?.won_bets || 0}</p>
              {(profile?.lost_bets ?? 0) > 0 && (
                <p className="text-loss text-sm mb-0.5 flex items-center gap-0.5">
                  <TrendingDown size={12} />
                  {profile?.lost_bets}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-pending/10 rounded-lg flex items-center justify-center">
                <Target size={16} className="text-pending" />
              </div>
              <span className="text-text-muted text-xs">% Éxito</span>
            </div>
            <p className="text-pending font-bold text-2xl">{winRate}%</p>
          </Card>
        </div>

        {/* Bankruptcy banner */}
        {profile?.bankruptcy_at && profile.points === 0 && (
          <BankruptcyBanner bankruptcyAt={profile.bankruptcy_at} />
        )}

        {/* Desktop 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active bet */}
            {activeBet ? (
              <Card glow className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="pending" dot>Apuesta Activa</Badge>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-text-muted mb-1">
                      {activeBet.event && getSportIcon(activeBet.event.sport)} {activeBet.event?.competition}
                    </p>
                    <p className="text-text-primary font-semibold mb-3">
                      {activeBet.event?.home_team} vs {activeBet.event?.away_team}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-text-muted">Predicción: </span>
                        <span className="text-accent font-medium">{getPredictionLabel(activeBet.prediction)}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Apostado: </span>
                        <span className="text-text-primary font-medium">{formatPoints(activeBet.amount)} pts</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted mb-1">Ganancia potencial</p>
                    <p className="text-win font-bold text-xl">{formatPoints(activeBet.potential_win)} pts</p>
                    <p className="text-xs text-text-muted">Cuota {formatOdds(activeBet.odds)}</p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-primary font-semibold mb-1">Sin apuesta activa</p>
                    <p className="text-text-muted text-sm">Realiza tu próxima predicción ahora</p>
                  </div>
                  <Link href="/events">
                    <Button>Ver eventos</Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* Upcoming events */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-xl text-text-primary">Próximos Eventos</h2>
                <Link href="/events" className="text-accent text-sm font-medium hover:text-accent-dim">Ver todos →</Link>
              </div>
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <UpcomingEvents
                  events={upcomingEvents as Event[]}
                  profile={(profile || null) as Profile | null}
                  hasActiveBet={!!activeBet}
                />
              ) : (
                <EmptyState icon="📅" title="No hay eventos próximos" description="El administrador publicará nuevos eventos pronto." />
              )}
            </div>
          </div>

          {/* Right panel — desktop only */}
          <div className="space-y-4">
            {/* Recent bets */}
            {recentBets && recentBets.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-bold text-base text-text-primary">Últimas Apuestas</h2>
                  <Link href="/bets" className="text-accent text-xs font-medium hover:text-accent-dim">Ver todas →</Link>
                </div>
                <div className="space-y-2">
                  {recentBets.map((bet) => (
                    <div key={bet.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <span className="text-base">{bet.event && getSportIcon(bet.event.sport)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary text-xs font-medium truncate">
                          {bet.event?.home_team} vs {bet.event?.away_team}
                        </p>
                        <p className="text-text-muted text-[10px]">{getPredictionLabel(bet.prediction)} · {formatPoints(bet.amount)} pts</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {bet.status === "won" && <span className="text-win font-bold text-xs">+{formatPoints(bet.potential_win)}</span>}
                        {bet.status === "lost" && <span className="text-loss font-bold text-xs">-{formatPoints(bet.amount)}</span>}
                        {bet.status === "cancelled" && <span className="text-text-muted text-xs">Cancelada</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick links */}
            <Card className="p-4">
              <h2 className="font-display font-bold text-base text-text-primary mb-3">Accesos rápidos</h2>
              <div className="space-y-1">
                {[
                  { href: "/events", label: "Ver eventos disponibles", icon: "📅" },
                  { href: "/leaderboard", label: "Clasificación global", icon: "🏆" },
                  { href: "/rewards", label: "Canjear premios", icon: "🎁" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-2 transition-colors text-text-secondary hover:text-text-primary text-sm"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
  );
}

export const dynamic = "force-dynamic";
