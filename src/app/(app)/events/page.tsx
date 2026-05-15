"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { EventCard } from "@/components/events/EventCard";
import { BetModal } from "@/components/bets/BetModal";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProfile } from "@/hooks/useProfile";
import { useActiveBet } from "@/hooks/useActiveBet";
import type { Event, BetResult, Sport } from "@/types";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";

const SPORTS: { value: Sport | "all"; label: string; icon: string }[] = [
  { value: "all",        label: "Todos",      icon: "🏆" },
  { value: "football",   label: "Fútbol",     icon: "⚽" },
  { value: "basketball", label: "Baloncesto", icon: "🏀" },
  { value: "tennis",     label: "Tenis",      icon: "🎾" },
  { value: "baseball",   label: "Béisbol",    icon: "⚾" },
  { value: "volleyball", label: "Voleibol",   icon: "🏐" },
  { value: "other",      label: "Otro",       icon: "🎯" },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "finished">("pending");
  const [sportFilter, setSportFilter] = useState<Sport | "all">("all");
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<{ event: Event; prediction: BetResult } | null>(null);
  const { profile, refetch: refetchProfile } = useProfile();
  const { activeBet, refetch: refetchActiveBet } = useActiveBet();
  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("events").select("*").order("event_date", { ascending: true });

    if (filter === "pending") {
      query = query.in("status", ["pending", "live"]).gt("event_date", new Date().toISOString());
    } else {
      query = query.in("status", ["finished", "cancelled"]);
    }

    if (sportFilter !== "all") {
      query = query.eq("sport", sportFilter);
    }

    const { data } = await query.limit(500);
    setEvents(data || []);
    setLeagueFilter("all");
    setLoading(false);
  }, [filter, sportFilter, supabase]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Leagues available for the current sport filter
  const leagues = useMemo(() => {
    const set = new Set(events.map((e) => e.competition));
    return Array.from(set).sort();
  }, [events]);

  // Client-side league + search filter
  const visibleEvents = useMemo(() => {
    return events.filter((e) => {
      if (leagueFilter !== "all" && e.competition !== leagueFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.home_team.toLowerCase().includes(q) ||
          e.away_team.toLowerCase().includes(q) ||
          e.competition.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, leagueFilter, search]);

  const handleBetSuccess = () => {
    refetchProfile();
    refetchActiveBet();
    fetchEvents();
  };

  return (
    <>
      <div className="space-y-5">
        <div>
          <h1 className="font-display font-black text-3xl text-text-primary mb-1">Eventos</h1>
          <p className="text-text-muted text-sm">Elige un evento y realiza tu predicción</p>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3">

          {/* Row: status tabs + filter toggle + search */}
          <div className="flex gap-2">
            {/* Status */}
            <div className="flex gap-2 flex-1">
              {(["pending", "finished"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === s
                      ? "bg-accent text-background"
                      : "bg-surface-2 text-text-secondary hover:text-text-primary border border-border"
                  }`}
                >
                  {s === "pending" ? "Disponibles" : "Finalizados"}
                </button>
              ))}
            </div>

            {/* Filter toggle button */}
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                filtersOpen || sportFilter !== "all" || leagueFilter !== "all"
                  ? "bg-accent/15 border-accent/30 text-accent"
                  : "bg-surface-2 border-border text-text-muted hover:text-text-primary"
              }`}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filtros</span>
              {(sportFilter !== "all" || leagueFilter !== "all") && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              )}
              <ChevronDown size={12} className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Collapsible sport + league filters */}
          {filtersOpen && (
            <div className="flex flex-col gap-2 p-3 bg-surface-2 border border-border rounded-xl">
              {/* Sport */}
              <div className="flex flex-wrap gap-1.5">
                {SPORTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSportFilter(s.value as Sport | "all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      sportFilter === s.value
                        ? "bg-blue-muted border border-blue/30 text-blue"
                        : "bg-surface-1 text-text-muted hover:text-text-secondary border border-border"
                    }`}
                  >
                    <span>{s.icon}</span>{s.label}
                  </button>
                ))}
              </div>

              {/* League */}
              {leagues.length > 1 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
                  <button
                    onClick={() => setLeagueFilter("all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      leagueFilter === "all"
                        ? "bg-accent/15 border border-accent/30 text-accent"
                        : "bg-surface-1 text-text-muted hover:text-text-secondary border border-border"
                    }`}
                  >
                    Todas
                  </button>
                  {leagues.map((league) => (
                    <button
                      key={league}
                      onClick={() => setLeagueFilter(league)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        leagueFilter === league
                          ? "bg-accent/15 border border-accent/30 text-accent"
                          : "bg-surface-1 text-text-muted hover:text-text-secondary border border-border"
                      }`}
                    >
                      {league}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search — font-size 16px prevents iOS zoom on focus */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar equipo o competición…"
              style={{ fontSize: "16px" }}
              className="w-full bg-surface-2 border border-border rounded-xl pl-8 pr-8 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition">
                <X size={13} />
              </button>
            )}
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
        ) : visibleEvents.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No hay eventos"
            description={
              search
                ? `No se encontraron eventos para "${search}".`
                : "No se encontraron eventos con los filtros seleccionados."
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {visibleEvents.map((event) => (
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

export const dynamic = "force-dynamic";
