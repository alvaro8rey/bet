"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatOdds, formatPoints, calculatePotentialWin, getPredictionLabel, getSportIcon } from "@/utils";
import type { Event, BetResult, Profile } from "@/types";
import toast from "react-hot-toast";
import { X, TrendingUp, AlertCircle } from "lucide-react";

interface BetModalProps {
  event: Event;
  prediction: BetResult;
  profile: Profile;
  onClose: () => void;
  onSuccess: () => void;
}

export function BetModal({ event, prediction, profile, onClose, onSuccess }: BetModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const odds = prediction === "home" ? event.home_odds : prediction === "draw" ? event.draw_odds! : event.away_odds;
  const numAmount = parseInt(amount) || 0;
  const potentialWin = calculatePotentialWin(numAmount, odds);
  const profit = potentialWin - numAmount;

  const quickAmounts = [50, 100, 250, 500].filter((a) => a <= profile.points);

  const handleBet = async () => {
    const betAmount = parseInt(amount);
    if (!betAmount || betAmount <= 0) {
      toast.error("Introduce una cantidad válida");
      return;
    }
    if (betAmount > profile.points) {
      toast.error("No tienes suficientes puntos");
      return;
    }
    if (betAmount < 10) {
      toast.error("La apuesta mínima es 10 puntos");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Check no active bet
      const { data: existing } = await supabase
        .from("bets")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        toast.error("Ya tienes una apuesta activa. Espera a que se resuelva.");
        onClose();
        return;
      }

      // Create bet
      const { error: betError } = await supabase.from("bets").insert({
        user_id: user.id,
        event_id: event.id,
        prediction,
        amount: betAmount,
        odds,
        potential_win: potentialWin,
        status: "pending",
      });

      if (betError) throw betError;

      // Deduct points
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ points: profile.points - betAmount, total_bets: profile.total_bets + 1 })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      toast.success(`¡Apuesta realizada! ${betAmount} pts apostados 🎯`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al realizar la apuesta");
    } finally {
      setLoading(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const predictionTeam = prediction === "home" ? event.home_team : prediction === "away" ? event.away_team : "Empate";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-card-hover animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <p className="text-xs text-text-muted font-medium mb-0.5">
              {getSportIcon(event.sport)} {event.competition}
            </p>
            <h3 className="font-bold text-text-primary">
              {event.home_team} vs {event.away_team}
            </h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Prediction summary */}
          <div className="bg-accent-muted border border-accent/20 rounded-xl p-4 flex items-center gap-3">
            <TrendingUp className="text-accent" size={20} />
            <div>
              <p className="text-xs text-text-muted">Tu predicción</p>
              <p className="text-accent font-bold">
                {getPredictionLabel(prediction)}: {predictionTeam}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-text-muted">Cuota</p>
              <p className="text-accent font-bold text-xl">{formatOdds(odds)}</p>
            </div>
          </div>

          {/* Balance */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Balance disponible</span>
            <span className="text-accent font-semibold">{formatPoints(profile.points)} pts</span>
          </div>

          {/* Amount input */}
          <div>
            <Input
              label="Puntos a apostar (mín. 10)"
              type="number"
              min="10"
              max={profile.points}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              rightElement={
                <button
                  onClick={() => setAmount(String(profile.points))}
                  className="text-xs text-accent font-semibold hover:text-accent-dim"
                >
                  MAX
                </button>
              }
            />

            {/* Quick amounts */}
            {quickAmounts.length > 0 && (
              <div className="flex gap-2 mt-2">
                {quickAmounts.map((qa) => (
                  <button
                    key={qa}
                    onClick={() => setAmount(String(qa))}
                    className="flex-1 py-1.5 text-xs bg-surface-2 hover:bg-surface-3 border border-border rounded-lg text-text-secondary transition-colors"
                  >
                    {qa}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Potential win */}
          {numAmount > 0 && (
            <div className="bg-surface-2 rounded-xl p-4 border border-border space-y-2 animate-fade-in">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Apuesta</span>
                <span className="text-text-primary font-medium">{formatPoints(numAmount)} pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Cuota</span>
                <span className="text-text-primary font-medium">×{formatOdds(odds)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Ganancia potencial</span>
                <div className="text-right">
                  <span className="text-win font-bold text-lg">{formatPoints(potentialWin)} pts</span>
                  <p className="text-win/60 text-xs">+{formatPoints(profit)} pts beneficio</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 text-text-muted bg-surface-2 rounded-xl p-3 border border-border">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs">
              Solo puedes tener una apuesta activa. Los puntos se descontarán ahora y se añadirán si ganas.
            </p>
          </div>

          {/* CTA */}
          <Button
            fullWidth
            size="lg"
            onClick={handleBet}
            loading={loading}
            disabled={!numAmount || numAmount > profile.points || numAmount < 10}
          >
            Confirmar apuesta
          </Button>
        </div>
      </div>
    </div>
  );
}
