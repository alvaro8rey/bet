"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { BetModal } from "@/components/bets/BetModal";
import { Card } from "@/components/ui/Card";
import { formatDateShort, formatOdds, getSportIcon } from "@/utils";
import type { BetResult, Event, Profile } from "@/types";

interface UpcomingEventsProps {
  events: Event[];
  profile: Profile | null;
  hasActiveBet: boolean;
}

export function UpcomingEvents({ events, profile, hasActiveBet }: UpcomingEventsProps) {
  const router = useRouter();
  const [selectedBet, setSelectedBet] = useState<{ event: Event; prediction: BetResult } | null>(null);

  const openBetModal = (event: Event, prediction: BetResult) => {
    if (!profile || hasActiveBet) return;
    setSelectedBet({ event, prediction });
  };

  const handleBetSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-3">
        {events.map((event) => (
          <Card key={event.id} hover className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span>{getSportIcon(event.sport)}</span>
              <span className="text-xs text-text-muted">{event.competition}</span>
              <div className="flex items-center gap-1 ml-auto text-text-muted">
                <Calendar size={11} />
                <span className="text-xs">{formatDateShort(event.event_date)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 mb-1">
              {/* Home */}
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-7 h-7">
                  {event.home_team_logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.home_team_logo} alt={event.home_team} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-surface-2 rounded-lg flex items-center justify-center text-sm border border-border">
                      {getSportIcon(event.sport)}
                    </div>
                  )}
                </div>
                <p className="text-text-primary text-xs font-semibold text-center leading-tight line-clamp-1">{event.home_team}</p>
              </div>

              <span className="text-text-muted text-xs font-normal shrink-0">vs</span>

              {/* Away */}
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-7 h-7">
                  {event.away_team_logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.away_team_logo} alt={event.away_team} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-surface-2 rounded-lg flex items-center justify-center text-sm border border-border">
                      {getSportIcon(event.sport)}
                    </div>
                  )}
                </div>
                <p className="text-text-primary text-xs font-semibold text-center leading-tight line-clamp-1">{event.away_team}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <DashboardOddsButton
                label="1"
                odds={event.home_odds}
                disabled={!profile || hasActiveBet}
                onClick={() => openBetModal(event, "home")}
              />
              {event.draw_odds && (
                <DashboardOddsButton
                  label="X"
                  odds={event.draw_odds}
                  disabled={!profile || hasActiveBet}
                  onClick={() => openBetModal(event, "draw")}
                />
              )}
              <DashboardOddsButton
                label="2"
                odds={event.away_odds}
                disabled={!profile || hasActiveBet}
                onClick={() => openBetModal(event, "away")}
              />
            </div>
          </Card>
        ))}
      </div>

      {selectedBet && profile && (
        <BetModal
          event={selectedBet.event}
          prediction={selectedBet.prediction}
          profile={profile}
          onClose={() => setSelectedBet(null)}
          onSuccess={handleBetSuccess}
        />
      )}
    </>
  );
}

interface DashboardOddsButtonProps {
  label: string;
  odds: number;
  disabled: boolean;
  onClick: () => void;
}

function DashboardOddsButton({ label, odds, disabled, onClick }: DashboardOddsButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        flex-1 rounded-lg p-1.5 text-center border transition-all duration-200
        ${disabled
          ? "bg-surface-2 border-border opacity-50 cursor-not-allowed"
          : "bg-surface-2 border-border hover:border-accent hover:bg-accent-muted active:scale-95 cursor-pointer"
        }
      `}
    >
      <p className="text-accent font-bold text-sm">{formatOdds(odds)}</p>
      <p className="text-text-muted text-[10px]">{label}</p>
    </button>
  );
}
