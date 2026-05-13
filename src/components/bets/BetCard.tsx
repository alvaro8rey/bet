import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPoints, formatOdds, formatDate, getPredictionLabel, getSportIcon } from "@/utils";
import type { Bet, BetStatus } from "@/types";

interface BetCardProps {
  bet: Bet;
}

export function BetCard({ bet }: BetCardProps) {
  const statusVariant: Record<BetStatus, "pending" | "win" | "loss" | "default"> = {
    pending: "pending",
    won: "win",
    lost: "loss",
    cancelled: "default",
  };

  const statusLabel: Record<BetStatus, string> = {
    pending: "Pendiente",
    won: "Ganada ✓",
    lost: "Perdida ✗",
    cancelled: "Cancelada",
  };

  return (
    <Card className="animate-fade-in">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {bet.event && <span className="text-sm">{getSportIcon(bet.event.sport)}</span>}
              <p className="text-xs text-text-muted truncate">{bet.event?.competition}</p>
            </div>
            <p className="text-text-primary font-semibold text-sm">
              {bet.event?.home_team} vs {bet.event?.away_team}
            </p>
          </div>
          <Badge variant={statusVariant[bet.status]}>{statusLabel[bet.status]}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-surface-2 rounded-xl p-3 border border-border">
            <p className="text-text-muted text-xs mb-1">Predicción</p>
            <p className="text-text-primary text-sm font-semibold">{getPredictionLabel(bet.prediction)}</p>
          </div>
          <div className="bg-surface-2 rounded-xl p-3 border border-border">
            <p className="text-text-muted text-xs mb-1">Apostado</p>
            <p className="text-text-primary text-sm font-semibold">{formatPoints(bet.amount)} pts</p>
          </div>
          <div className="bg-surface-2 rounded-xl p-3 border border-border">
            <p className="text-text-muted text-xs mb-1">Cuota</p>
            <p className="text-accent text-sm font-bold">{formatOdds(bet.odds)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-text-muted text-xs">{formatDate(bet.created_at)}</p>
          <div className="text-right">
            {bet.status === "pending" && (
              <p className="text-pending text-sm font-semibold">
                Ganancia pot.: {formatPoints(bet.potential_win)} pts
              </p>
            )}
            {bet.status === "won" && (
              <p className="text-win text-sm font-bold">
                +{formatPoints(bet.potential_win)} pts 🎉
              </p>
            )}
            {bet.status === "lost" && (
              <p className="text-loss text-sm font-semibold">
                -{formatPoints(bet.amount)} pts
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
