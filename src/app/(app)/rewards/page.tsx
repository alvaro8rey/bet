"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
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

const BRAND_GROUPS = [
  { name: "Amazon",           keywords: ["amazon"] },
  { name: "Steam",            keywords: ["steam"] },
  { name: "PlayStation",      keywords: ["psn"] },
  { name: "Google Play",      keywords: ["google play"] },
  { name: "PayPal",           keywords: ["paypal"] },
  { name: "Spotify",          keywords: ["spotify"] },
  { name: "El Corte Inglés",  keywords: ["corte ingl"] },
  { name: "FNAC",             keywords: ["fnac"] },
];

function matchesBrand(reward: Reward, keywords: string[]) {
  const lower = reward.nombre.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function DenominationChip({
  reward,
  userPoints,
  onClick,
}: {
  reward: Reward;
  userPoints: number;
  onClick: () => void;
}) {
  const unlocked = userPoints >= reward.puntos_necesarios;
  const pct = Math.min((userPoints / reward.puntos_necesarios) * 100, 100);

  return (
    <button
      onClick={unlocked ? onClick : undefined}
      disabled={!unlocked}
      className={`relative flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-all min-w-[100px] ${
        unlocked
          ? "border-accent/50 bg-accent/5 hover:bg-accent/10"
          : "border-border bg-surface-2 cursor-not-allowed opacity-60"
      }`}
    >
      <span className={`font-bold text-lg ${unlocked ? "text-accent" : "text-text-primary"}`}>
        {reward.valor_euros % 1 === 0 ? `${reward.valor_euros}€` : reward.nombre.replace(/.*?(\d+[€]?.*)/, "$1")}
      </span>
      <span className="text-text-muted text-[10px]">{formatPoints(reward.puntos_necesarios)} pts</span>
      {/* mini progress */}
      <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {unlocked ? (
        <span className="text-[10px] text-accent font-medium flex items-center gap-0.5">
          <Check size={10} /> Disponible
        </span>
      ) : (
        <span className="text-[10px] text-text-muted flex items-center gap-0.5">
          <Lock size={10} /> {formatPoints(reward.puntos_necesarios - userPoints)} pts
        </span>
      )}
    </button>
  );
}

function BrandSection({
  name,
  rewards,
  userPoints,
  onRedeemClick,
}: {
  name: string;
  rewards: Reward[];
  userPoints: number;
  onRedeemClick: (r: Reward) => void;
}) {
  const image = rewards.find((r) => r.imagen_url)?.imagen_url;
  const anyUnlocked = rewards.some((r) => userPoints >= r.puntos_necesarios);

  return (
    <div className={`flex items-center gap-5 p-4 rounded-2xl border transition-all ${anyUnlocked ? "border-accent/30 bg-accent/5" : "border-border bg-surface"}`}>
      {image && (
        <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white flex items-center justify-center">
          <img src={image} alt={name} className="w-full h-full object-contain p-1.5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary text-sm mb-3">{name}</p>
        <div className="flex flex-wrap gap-2">
          {rewards.map((r) => (
            <DenominationChip
              key={r.id}
              reward={r}
              userPoints={userPoints}
              onClick={() => onRedeemClick(r)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PhysicalCard({
  reward,
  userPoints,
  onRedeemClick,
}: {
  reward: Reward;
  userPoints: number;
  onRedeemClick: (r: Reward) => void;
}) {
  const unlocked = userPoints >= reward.puntos_necesarios;
  const pct = Math.min((userPoints / reward.puntos_necesarios) * 100, 100);

  return (
    <Card className="overflow-hidden hover:border-accent/40 transition-all flex flex-col">
      {reward.imagen_url && (
        <div className="w-full h-44 bg-white overflow-hidden">
          <img src={reward.imagen_url} alt={reward.nombre} className="w-full h-full object-contain p-3" />
        </div>
      )}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div>
          <h3 className="font-semibold text-text-primary text-sm">{reward.nombre}</h3>
          <p className="text-text-muted text-xs mt-0.5">{reward.descripcion}</p>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Progreso</span>
            <span className="text-accent font-bold">{Math.round(pct)}%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>{formatPoints(userPoints)}</span>
            <span>{formatPoints(reward.puntos_necesarios)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border mt-auto">
          {unlocked ? (
            <span className="text-accent text-xs font-medium flex items-center gap-1"><Check size={12} /> Disponible</span>
          ) : (
            <span className="text-text-muted text-xs flex items-center gap-1"><Lock size={12} /> {formatPoints(reward.puntos_necesarios - userPoints)} pts</span>
          )}
          <button
            onClick={() => onRedeemClick(reward)}
            disabled={!unlocked}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              unlocked ? "bg-accent text-background hover:bg-accent-dim" : "bg-surface-2 text-text-muted cursor-not-allowed"
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
  const digitalRewards = rewards.filter((r) => r.categoria === "digital");
  const fisicosRewards = rewards.filter((r) => r.categoria === "fisico");

  const grouped = BRAND_GROUPS.map((brand) => ({
    ...brand,
    rewards: digitalRewards.filter((r) => matchesBrand(r, brand.keywords)),
  })).filter((g) => g.rewards.length > 0);

  const ungroupedDigital = digitalRewards.filter(
    (r) => !BRAND_GROUPS.some((b) => matchesBrand(r, b.keywords))
  );

  const nextReward = rewards.find((r) => r.puntos_necesarios > userPoints);
  const pointsToNext = nextReward ? nextReward.puntos_necesarios - userPoints : 0;

  return (
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
              <p className="font-semibold text-text-primary">{nextReward.nombre}</p>
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-accent" />
                <span className="text-accent font-bold">{formatPoints(pointsToNext)}</span>
                <span className="text-text-muted text-sm">pts para desbloquear</span>
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

      {loading ? <PageLoader /> : (
        <>
          {/* Digital — agrupados por marca */}
          {grouped.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-lg text-text-primary mb-1">Premios Digitales</h2>
                <p className="text-text-muted text-xs">Códigos, suscripciones y créditos</p>
              </div>
              <div className="space-y-3">
                {grouped.map((brand) => (
                  <BrandSection
                    key={brand.name}
                    name={brand.name}
                    rewards={brand.rewards}
                    userPoints={userPoints}
                    onRedeemClick={setSelectedReward}
                  />
                ))}
                {ungroupedDigital.map((r) => (
                  <BrandSection
                    key={r.id}
                    name={r.nombre}
                    rewards={[r]}
                    userPoints={userPoints}
                    onRedeemClick={setSelectedReward}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Físicos */}
          {fisicosRewards.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-lg text-text-primary mb-1">Premios Físicos</h2>
                <p className="text-text-muted text-xs">Artículos y consolas</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fisicosRewards.map((r) => (
                  <PhysicalCard key={r.id} reward={r} userPoints={userPoints} onRedeemClick={setSelectedReward} />
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
  );
}
