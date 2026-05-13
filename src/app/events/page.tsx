"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { EventCard } from "@/components/events/EventCard";
import { BetModal } from "@/components/bets/BetModal";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useProfile } from "@/hooks/useProfile";
import { useActiveBet } from "@/hooks/useActiveBet";
import type { Event, BetResult, Sport } from "@/types";
import { getSportLabel, getSportIcon } from "@/utils";
import { Filter } from "lucide-react";

const SPORTS: { value: Sport | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "football", label: "Fútbol" },
  { value: "tennis", label: "Tenis" },
  { value: "basketball", label: "Baloncesto" },
  { value: "baseball", label: "Béisbol" },
  { value: "volleyball", label: "Voleibol" },
  { value: "other", label: "Otro" },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "finished">("pending");
  const [sportFilter, setSportFilter] = useState<Sport | "all">("all");
  const [selectedBet, setSelectedBet] = useState<{ event: Event; prediction: BetResult } | null>(null);
  const { profile, refetch: refetchProfile } = useProfile();
  const { activeBet, refetch: refetchActiveBet } = useActiveBet();
  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("events").select("*").order("event_date", { ascending: true });

    if (filter === "pending") {
      query = query.in("status", ["pending", "live"]);
    } else {
      query = query.in("status", ["finished", "cancelled"]);
    }

    if (sportFilter !== "all") {
      query = query.eq("sport", sportFilter);
    }

    const { data } = await query;
    setEvents(data || []);
    setLoading(false);
  }, [filter, sportFilter, supabase]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleBetSuccess = () => {
    refetchProfile();
    refetchActiveBet();
    fetchEvents();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-black text-3xl text-text-primary mb-1">Eventos</h1>
          <p className="text-text-muted text-sm">Elige un evento y realiza tu predicción</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          {/* Status filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === "pending"
                  ? "bg-accent text-background"
                  : "bg-surface-2 text-text-secondary hover:text-text-primary border border-border"
              }`}
            >
              Disponibles
            </button>
            <button
              onClick={() => setFilter("finished")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === "finished"
                  ? "bg-accent text-background"
                  : "bg-surface-2 text-text-secondary hover:text-text-primary border border-border"
              }`}
            >
              Finalizados
            </button>
          </div>

          {/* Sport filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {SPORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSportFilter(s.value as Sport | "all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sportFilter === s.value
                    ? "bg-blue-muted border border-blue/30 text-blue"
                    : "bg-surface-2 text-text-muted hover:text-text-secondary border border-border"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active bet warning */}
        {activeBet && (
          <div className="bg-pending/10 border border-pending/30 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-pending font-semibold text-sm">Tienes una apuesta activa</p>
              <p className="text-text-muted text-xs">No puedes apostar hasta que se resuelva tu apuesta actual.</p>
            </div>
          </div>
        )}

        {/* Events list */}
        {loading || !profile ? (
          <PageLoader />
        ) : events.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No hay eventos disponibles"
            description="No se encontraron eventos con los filtros seleccionados."
          />
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onBet={(e, p) => setSelectedBet({ event: e, prediction: p })}
                hasActiveBet={!!activeBet}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bet modal */}
      {selectedBet && profile && (
        <BetModal
          event={selectedBet.event}
          prediction={selectedBet.prediction}
          profile={profile}
          onClose={() => setSelectedBet(null)}
          onSuccess={handleBetSuccess}
        />
      )}
    </AppLayout>
  );
}

export const dynamic = "force-dynamic";
