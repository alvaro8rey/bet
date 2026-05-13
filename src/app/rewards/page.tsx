"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { RedeemModal } from "@/components/RedeemModal";
import { PageLoader } from "@/components/ui/Spinner";
import { formatPoints } from "@/utils";
import { Lock, Gift, Check } from "lucide-react";

interface Reward {
  id: number;
  puntos_necesarios: number;
  categoria: "digital" | "fisico";
  nombre: string;
  descripcion: string;
  valor_euros: number;
  imagen_url?: string;
}

function RewardCard({
  reward,
  userPoints,
  onRedeemClick,
}: {
  reward: Reward;
  userPoints: number;
  onRedeemClick: (reward: Reward) => void;
}) {
  const hasEnoughPoints = userPoints >= reward.puntos_necesarios;
  const progressPercentage = Math.min((userPoints / reward.puntos_necesarios) * 100, 100);
  const pointsRemaining = Math.max(reward.puntos_necesarios - userPoints, 0);

  return (
    <Card className="overflow-hidden hover:border-accent/40 transition-all flex flex-col">
      {/* Image */}
      {reward.imagen_url && (
        <div className="relative w-full h-48 overflow-hidden bg-surface-2">
          <img
            src={reward.imagen_url}
            alt={reward.nombre}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-5 space-y-4 flex-1 flex flex-col">
        {/* Header con badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary text-base mb-1">{reward.nombre}</h3>
            <p className="text-text-muted text-xs">{reward.descripcion}</p>
          </div>
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 ${
              reward.categoria === "digital"
                ? "bg-blue/15 text-blue"
                : "bg-gold/15 text-gold"
            }`}
          >
            {reward.categoria === "digital" ? "Digital" : "Físico"}
          </div>
        </div>

        {/* Progress section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-xs font-medium">Progreso</span>
            <span className="text-accent font-bold text-sm">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-dim transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">{formatPoints(userPoints)}</span>
            <span className="text-text-muted">{formatPoints(reward.puntos_necesarios)}</span>
          </div>
        </div>

        {/* Points needed or button */}
        <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
          <div>
            {!hasEnoughPoints ? (
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-text-muted" />
                <span className="text-text-muted text-xs">{formatPoints(pointsRemaining)} puntos</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check size={14} className="text-accent" />
                <span className="text-accent text-xs font-medium">¡Disponible!</span>
              </div>
            )}
          </div>

          <button
            onClick={() => onRedeemClick(reward)}
            disabled={!hasEnoughPoints}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              hasEnoughPoints
                ? "bg-accent text-background hover:bg-accent-dim"
                : "bg-surface-2 text-text-muted cursor-not-allowed"
            }`}
          >
            Canjear
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function RewardsPage() {
  const { profile, refetch } = useProfile();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchRewards = async () => {
      const { data } = await supabase
        .from("rewards")
        .select("*")
        .order("puntos_necesarios", { ascending: true });
      setRewards(data || []);
      setLoading(false);
    };
    fetchRewards();
  }, []);

  const userPoints = profile?.points || 0;
  const nextReward = rewards.find((r) => r.puntos_necesarios > userPoints);
  const pointsToNextReward = nextReward ? nextReward.puntos_necesarios - userPoints : 0;
  const digitalRewards = rewards.filter((r) => r.categoria === "digital");
  const fisicosRewards = rewards.filter((r) => r.categoria === "fisico");

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="font-display font-black text-3xl text-text-primary mb-1">Premios</h1>
          <p className="text-text-muted text-sm">Canjea tus puntos por increíbles premios</p>
        </div>

        {/* Balance card */}
        <Card glow className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-text-muted text-xs font-medium">Tu balance actual</p>
              <div className="flex items-end gap-2">
                <span className="font-display font-black text-3xl text-accent">
                  {profile ? formatPoints(profile.points) : "—"}
                </span>
                <span className="text-text-muted mb-1">puntos</span>
              </div>
            </div>

            {nextReward ? (
              <div className="space-y-2">
                <p className="text-text-muted text-xs font-medium">Próximo premio</p>
                <div className="space-y-1">
                  <p className="font-semibold text-text-primary">{nextReward.nombre}</p>
                  <div className="flex items-center gap-2">
                    <Gift size={16} className="text-accent" />
                    <span className="text-accent font-bold">{formatPoints(pointsToNextReward)}</span>
                    <span className="text-text-muted text-sm">puntos para desbloquear</span>
                  </div>
                </div>
              </div>
            ) : !loading && (
              <div className="space-y-2">
                <p className="text-text-muted text-xs font-medium">Estado</p>
                <p className="font-semibold text-accent">¡Has desbloqueado todos los premios!</p>
              </div>
            )}
          </div>
        </Card>

        {loading ? (
          <PageLoader />
        ) : (
          <>
            {digitalRewards.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h2 className="font-semibold text-lg text-text-primary mb-1">Premios Digitales</h2>
                  <p className="text-text-muted text-xs">Códigos, suscripciones y créditos</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {digitalRewards.map((reward) => (
                    <RewardCard key={reward.id} reward={reward} userPoints={userPoints} onRedeemClick={setSelectedReward} />
                  ))}
                </div>
              </div>
            )}

            {fisicosRewards.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h2 className="font-semibold text-lg text-text-primary mb-1">Premios Físicos</h2>
                  <p className="text-text-muted text-xs">Artículos y consolas</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fisicosRewards.map((reward) => (
                    <RewardCard key={reward.id} reward={reward} userPoints={userPoints} onRedeemClick={setSelectedReward} />
                  ))}
                </div>
              </div>
            )}

            {rewards.length === 0 && (
              <div className="text-center py-16 text-text-muted">
                <Gift size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No hay premios disponibles aún</p>
              </div>
            )}
          </>
        )}

        {selectedReward && (
          <RedeemModal
            isOpen={!!selectedReward}
            onClose={() => setSelectedReward(null)}
            reward={selectedReward}
            onSuccess={() => { refetch(); setSelectedReward(null); }}
          />
        )}
      </div>
    </AppLayout>
  );
}
