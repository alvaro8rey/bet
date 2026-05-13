import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { BetCard } from "@/components/bets/BetCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatPoints, formatOdds, formatDate, getPredictionLabel, getSportIcon } from "@/utils";
import Link from "next/link";

export default async function BetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: bets } = await supabase
    .from("bets")
    .select("*, event:events(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const activeBets = bets?.filter((b) => b.status === "pending") || [];
  const resolvedBets = bets?.filter((b) => b.status !== "pending") || [];

  const totalWon = resolvedBets.filter((b) => b.status === "won").reduce((acc, b) => acc + b.potential_win, 0);
  const totalLost = resolvedBets.filter((b) => b.status === "lost").reduce((acc, b) => acc + b.amount, 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display font-black text-3xl text-text-primary mb-1">Mis Apuestas</h1>
          <p className="text-text-muted text-sm">Historial completo de predicciones</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">{bets?.length || 0}</p>
            <p className="text-text-muted text-xs mt-1">Total</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-win">+{formatPoints(totalWon)}</p>
            <p className="text-text-muted text-xs mt-1">Ganado</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-loss">-{formatPoints(totalLost)}</p>
            <p className="text-text-muted text-xs mt-1">Perdido</p>
          </Card>
        </div>

        {/* Active bet */}
        {activeBets.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-xl text-text-primary mb-3">Apuesta Activa</h2>
            {activeBets.map((bet) => (
              <Card key={bet.id} glow className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="pending" dot>Pendiente de resultado</Badge>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-text-muted mb-1">
                      {bet.event && getSportIcon(bet.event.sport)} {bet.event?.competition}
                    </p>
                    <p className="text-text-primary font-bold text-lg">
                      {bet.event?.home_team} vs {bet.event?.away_team}
                    </p>
                    <p className="text-text-secondary text-sm mt-1">
                      Predicción: <span className="text-accent font-medium">{getPredictionLabel(bet.prediction)}</span>
                    </p>
                    <p className="text-text-muted text-xs mt-1">{formatDate(bet.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-muted text-xs mb-1">Apostado</p>
                    <p className="text-text-primary font-bold">{formatPoints(bet.amount)} pts</p>
                    <p className="text-text-muted text-xs mt-2">Cuota {formatOdds(bet.odds)}</p>
                    <p className="text-win font-semibold text-sm mt-1">
                      Potencial: {formatPoints(bet.potential_win)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Resolved bets */}
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary mb-3">Historial</h2>

          {resolvedBets.length === 0 && activeBets.length === 0 ? (
            <EmptyState
              icon="🎯"
              title="Aún no has apostado"
              description="Visita la sección de eventos y realiza tu primera predicción."
              action={
                <Link href="/events">
                  <Button>Ver eventos disponibles</Button>
                </Link>
              }
            />
          ) : resolvedBets.length === 0 ? (
            <EmptyState
              icon="⏳"
              title="Sin historial aún"
              description="Tu apuesta activa aparecerá aquí cuando se resuelva."
            />
          ) : (
            <div className="space-y-3">
              {resolvedBets.map((bet) => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export const dynamic = "force-dynamic";
