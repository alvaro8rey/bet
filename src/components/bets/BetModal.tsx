"use client";

import { useState, useEffect } from "react";
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
      const response = await fetch("/api/bets/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
        prediction,
        amount: betAmount,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Error al realizar la apuesta");
      }

      toast.success(`¡Apuesta realizada! ${betAmount} pts apostados 🎯`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al realizar la apuesta");
    } finally {
      setLoading(false);
    }
  };

  // Close on Escape + lock body scroll
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const predictionTeam = prediction === "home" ? event.home_team : prediction === "away" ? event.away_team : "Empate";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-card-hover animate-slide-up flex flex-col mb-16 sm:mb-0" style={{ maxHeight: "calc(85vh - 64px)" }}>

        {/* Header — siempre visible */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div>
            <p className="text-xs text-text-muted font-medium mb-0.5">
              {getSportIcon(event.sport)} {event.competition}
            </p>
            <h3 className="font-semibold text-text-primary text-sm">
              {event.home_team} vs {event.away_team}
            </h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1 ml-2 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3">
          {/* Prediction summary */}
          <div className="bg-accent-muted border border-accent/20 rounded-xl p-3 flex items-center gap-3">
            <TrendingUp className="text-accent flex-shrink-0" size={18} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">Tu predicción</p>
              <p className="text-accent font-bold text-sm truncate">
                {getPredictionLabel(prediction)}: {predictionTeam}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-text-muted">Cuota</p>
              <p className="text-accent font-bold text-lg">{formatOdds(odds)}</p>
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
              <div className="flex gap-1.5 mt-2">
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

          {/* Potential win — compacto */}
          {numAmount > 0 && (
            <div className="bg-surface-2 rounded-xl px-3 py-2.5 border border-border animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-xs">Ganancia potencial</span>
                <div className="text-right">
                  <span className="text-win font-bold">{formatPoints(potentialWin)} pts</span>
                  <p className="text-win/60 text-xs">+{formatPoints(profit)} beneficio</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning — compacto */}
          <div className="flex items-start gap-2 text-text-muted">
            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs">Solo puedes tener una apuesta activa. Los puntos se descontarán ahora.</p>
          </div>
        </div>

        {/* Botón — siempre visible en la parte inferior */}
        <div className="px-4 py-3 border-t border-border flex-shrink-0">
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
