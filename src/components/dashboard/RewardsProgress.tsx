import Link from "next/link";
import { Gift, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatPoints } from "@/utils";

interface Reward {
  id: number;
  nombre: string;
  puntos_necesarios: number;
  categoria: "digital" | "fisico";
  imagen_url?: string;
}

interface RewardsProgressProps {
  currentPoints: number;
  nextReward: Reward;
}

export function RewardsProgress({ currentPoints, nextReward }: RewardsProgressProps) {
  const progress = Math.min((currentPoints / nextReward.puntos_necesarios) * 100, 100);
  const pointsLeft = nextReward.puntos_necesarios - currentPoints;

  return (
    <Link href="/rewards" className="block group">
      <Card hover className="p-4 border-accent/20 group-hover:border-accent/40 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center">
              <Gift size={15} className="text-accent" />
            </div>
            <div>
              <p className="text-text-primary text-sm font-semibold">Próximo premio</p>
              <p className="text-text-muted text-xs">{nextReward.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-accent">
            <span className="text-xs font-medium">{formatPoints(pointsLeft)} pts restantes</span>
            <ChevronRight size={14} />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-text-muted">
            <span>{formatPoints(currentPoints)} pts</span>
            <span>{formatPoints(nextReward.puntos_necesarios)} pts</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-dim rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-text-muted text-right">{Math.round(progress)}% completado</p>
        </div>
      </Card>
    </Link>
  );
}
