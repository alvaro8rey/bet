"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getSportIcon, getSportLabel, formatDateShort, formatOdds, getEventStatusLabel } from "@/utils";
import type { Event, BetResult } from "@/types";
import { Clock, ChevronRight } from "lucide-react";

interface EventCardProps {
  event: Event;
  onBet?: (event: Event, prediction: BetResult) => void;
  hasActiveBet?: boolean;
  compact?: boolean;
}

export function EventCard({ event, onBet, hasActiveBet, compact }: EventCardProps) {
  const statusVariant = {
    pending: "pending" as const,
    live: "live" as const,
    finished: "default" as const,
    cancelled: "default" as const,
  }[event.status];

  const isFinished = event.status === "finished" || event.status === "cancelled";

  return (
    <Card hover={!isFinished} className="animate-fade-in">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getSportIcon(event.sport)}</span>
            <div>
              <p className="text-xs text-text-muted font-medium">{getSportLabel(event.sport)}</p>
              <p className="text-xs text-text-secondary">{event.competition}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {event.status === "live" && (
              <Badge variant="live" dot>EN DIRECTO</Badge>
            )}
            {event.status === "pending" && (
              <div className="flex items-center gap-1.5 text-text-muted">
                <Clock size={12} />
                <span className="text-xs">{formatDateShort(event.event_date)}</span>
              </div>
            )}
            {event.status === "finished" && (
              <Badge variant="default">Finalizado</Badge>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-3 mb-4">
          {/* Home */}
          <div className="flex-1 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-surface-2 rounded-xl flex items-center justify-center text-xl border border-border">
              🏠
            </div>
            <p className="text-text-primary font-semibold text-sm leading-tight">{event.home_team}</p>
          </div>

          {/* Score / VS */}
          <div className="flex-shrink-0 text-center px-2">
            {event.status === "finished" && event.home_score !== null ? (
              <div className="bg-surface-2 rounded-xl px-4 py-2 border border-border">
                <span className="text-text-primary font-bold text-xl">
                  {event.home_score} — {event.away_score}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-text-muted text-xs">VS</span>
                <div className="w-8 h-0.5 bg-border rounded" />
              </div>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-surface-2 rounded-xl flex items-center justify-center text-xl border border-border">
              ✈️
            </div>
            <p className="text-text-primary font-semibold text-sm leading-tight">{event.away_team}</p>
          </div>
        </div>

        {/* Odds + Bet buttons */}
        {!compact && event.status === "pending" && (
          <div className={`grid gap-2 ${event.draw_odds ? "grid-cols-3" : "grid-cols-2"}`}>
            <OddsButton
              label="1"
              sublabel={event.home_team.split(" ")[0]}
              odds={event.home_odds}
              disabled={hasActiveBet}
              onClick={() => onBet?.(event, "home")}
            />
            {event.draw_odds && (
              <OddsButton
                label="X"
                sublabel="Empate"
                odds={event.draw_odds}
                disabled={hasActiveBet}
                onClick={() => onBet?.(event, "draw")}
              />
            )}
            <OddsButton
              label="2"
              sublabel={event.away_team.split(" ")[0]}
              odds={event.away_odds}
              disabled={hasActiveBet}
              onClick={() => onBet?.(event, "away")}
            />
          </div>
        )}

        {/* Finished odds (read-only) */}
        {!compact && isFinished && (
          <div className={`grid gap-2 ${event.draw_odds ? "grid-cols-3" : "grid-cols-2"}`}>
            <div className="bg-surface-2 rounded-xl p-2 text-center border border-border">
              <p className="text-text-muted text-xs">Local</p>
              <p className="text-text-primary font-bold">{formatOdds(event.home_odds)}</p>
            </div>
            {event.draw_odds && (
              <div className="bg-surface-2 rounded-xl p-2 text-center border border-border">
                <p className="text-text-muted text-xs">Empate</p>
                <p className="text-text-primary font-bold">{formatOdds(event.draw_odds)}</p>
              </div>
            )}
            <div className="bg-surface-2 rounded-xl p-2 text-center border border-border">
              <p className="text-text-muted text-xs">Visitante</p>
              <p className="text-text-primary font-bold">{formatOdds(event.away_odds)}</p>
            </div>
          </div>
        )}

        {hasActiveBet && event.status === "pending" && (
          <p className="text-center text-xs text-pending mt-3 font-medium">
            ⚠️ Ya tienes una apuesta activa
          </p>
        )}
      </div>
    </Card>
  );
}

interface OddsButtonProps {
  label: string;
  sublabel: string;
  odds: number;
  disabled?: boolean;
  onClick?: () => void;
}

function OddsButton({ label, sublabel, odds, disabled, onClick }: OddsButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center gap-0.5 py-2.5 px-3 rounded-xl border transition-all duration-200
        ${disabled
          ? "border-border bg-surface-2 opacity-50 cursor-not-allowed"
          : "border-border bg-surface-2 hover:border-accent hover:bg-accent-muted hover:shadow-accent-sm active:scale-95 cursor-pointer"
        }
      `}
    >
      <span className="text-text-muted text-xs font-medium">{label}</span>
      <span className="text-accent font-bold text-lg leading-none">{formatOdds(odds)}</span>
      <span className="text-text-muted text-[10px] truncate max-w-full">{sublabel}</span>
    </button>
  );
}
