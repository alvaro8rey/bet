import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { formatPoints, formatOdds, getSportIcon, getPredictionLabel } from "@/utils";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TrendingUp, Ticket, Trophy } from "lucide-react";
import type { Event, Profile } from "@/types";

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
    .limit(3);

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .eq("status", "pending")
    .order("event_date", { ascending: true })
    .limit(4);

  const winRate = profile && profile.total_bets > 0
    ? Math.round((profile.won_bets / profile.total_bets) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome */}
        <div>
          <h1 className="font-display font-black text-3xl text-text-primary mb-1">
            Hola, {profile?.username} 👋
          </h1>
          <p className="text-text-muted text-sm">Tu resumen de predicciones</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center">
                <span className="text-accent text-sm">💎</span>
              </div>
              <span className="text-text-muted text-xs">Puntos</span>
            </div>
            <p className="text-accent font-bold text-2xl">{formatPoints(profile?.points || 0)}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-muted rounded-lg flex items-center justify-center">
                <Ticket size={16} className="text-blue" />
              </div>
              <span className="text-text-muted text-xs">Total</span>
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
            <p className="text-win font-bold text-2xl">{profile?.won_bets || 0}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-pending/10 rounded-lg flex items-center justify-center">
                <Trophy size={16} className="text-pending" />
              </div>
              <span className="text-text-muted text-xs">% Éxito</span>
            </div>
            <p className="text-pending font-bold text-2xl">{winRate}%</p>
          </Card>
        </div>

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

        {/* Recent bets */}
        {recentBets && recentBets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl text-text-primary">Últimas Apuestas</h2>
              <Link href="/bets" className="text-accent text-sm font-medium hover:text-accent-dim">Ver todas →</Link>
            </div>
            <div className="space-y-2">
              {recentBets.map((bet) => (
                <Card key={bet.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{bet.event && getSportIcon(bet.event.sport)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-medium truncate">
                        {bet.event?.home_team} vs {bet.event?.away_team}
                      </p>
                      <p className="text-text-muted text-xs">{getPredictionLabel(bet.prediction)} · {formatPoints(bet.amount)} pts</p>
                    </div>
                    <div className="text-right">
                      {bet.status === "won" && <span className="text-win font-bold text-sm">+{formatPoints(bet.potential_win)}</span>}
                      {bet.status === "lost" && <span className="text-loss font-bold text-sm">-{formatPoints(bet.amount)}</span>}
                      {bet.status === "cancelled" && <span className="text-text-muted text-sm">Cancelada</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export const dynamic = "force-dynamic";
