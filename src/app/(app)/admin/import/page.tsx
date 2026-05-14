"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getSportIcon } from "@/utils";
import type { Sport } from "@/types";
import toast from "react-hot-toast";

interface ApiEvent {
  api_id: string;
  sport_key: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  home_odds: number;
  away_odds: number;
  draw_odds: number | null;
  our_sport: string;
  bookmakers_count: number;
}

interface ApiSport {
  key: string;
  title: string;
  description: string;
  active: boolean;
}

export default function ImportEventsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isAdmin, setIsAdmin] = useState(false);
  const [sports, setSports] = useState<ApiSport[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [loadingSports, setLoadingSports] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).single();
      if (!profile?.is_admin) { router.push("/dashboard"); return; }
      setIsAdmin(true);

      // Load already-imported api_event_ids
      const { data: existing } = await supabase.from("events").select("api_event_id").not("api_event_id", "is", null);
      if (existing) setImportedIds(new Set(existing.map((e) => e.api_event_id).filter(Boolean)));

      // Load sports list
      const res = await fetch("/api/sports-api?action=sports");
      if (res.ok) {
        const data: ApiSport[] = await res.json();
        setSports(data);
      }
      setLoadingSports(false);
    };
    init();
  }, [router, supabase]);

  const loadEvents = useCallback(async () => {
    if (!selectedSport) return;
    setLoadingEvents(true);
    setEvents([]);
    try {
      const res = await fetch(`/api/sports-api?action=odds&sport=${encodeURIComponent(selectedSport)}`);
      if (!res.ok) throw new Error("Error cargando partidos");
      const data: ApiEvent[] = await res.json();
      setEvents(data);
    } catch (err) {
      toast.error("No se pudieron cargar los partidos");
    } finally {
      setLoadingEvents(false);
    }
  }, [selectedSport]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const fetchTeamLogo = async (teamName: string, sport: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/team-logo?team=${encodeURIComponent(teamName)}&sport=${encodeURIComponent(sport)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.url ?? null;
    } catch {
      return null;
    }
  };

  const importEvent = async (event: ApiEvent) => {
    setImportingId(event.api_id);
    try {
      const [homeLogo, awayLogo] = await Promise.all([
        fetchTeamLogo(event.home_team, event.our_sport),
        fetchTeamLogo(event.away_team, event.our_sport),
      ]);

      const { error } = await supabase.from("events").insert({
        sport: event.our_sport,
        competition: event.sport_title,
        home_team: event.home_team,
        away_team: event.away_team,
        home_odds: event.home_odds,
        away_odds: event.away_odds,
        draw_odds: event.draw_odds,
        event_date: event.commence_time,
        status: "pending",
        home_score: null,
        away_score: null,
        result: null,
        api_event_id: event.api_id,
        api_sport_key: event.sport_key,
        home_team_logo: homeLogo,
        away_team_logo: awayLogo,
      });
      if (error) throw error;
      setImportedIds((prev) => new Set([...prev, event.api_id]));
      toast.success(`✓ ${event.home_team} vs ${event.away_team} importado`);
    } catch (err) {
      toast.error("Error al importar el partido");
    } finally {
      setImportingId(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const formatOdds = (n: number) => n.toFixed(2);

  if (!isAdmin && !loadingSports) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} /> Volver</Button>
        </Link>
        <div>
          <h1 className="font-display font-black text-3xl text-text-primary">Importar Partidos</h1>
          <p className="text-text-muted text-sm">Selecciona partidos de la API y publícalos con cuotas reales</p>
        </div>
      </div>

      {/* Sport selector */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-text-muted text-sm font-medium shrink-0">Liga / Competición:</span>
          {loadingSports ? (
            <span className="text-text-muted text-sm">Cargando deportes...</span>
          ) : (
            <div className="flex flex-wrap gap-2 flex-1">
              {sports.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSelectedSport(s.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedSport === s.key
                      ? "bg-accent text-background"
                      : "bg-surface-2 text-text-secondary hover:text-text-primary border border-border"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}
          {selectedSport && (
            <button onClick={loadEvents} className="text-text-muted hover:text-text-primary transition">
              <RefreshCw size={15} className={loadingEvents ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </Card>

      {/* Events list */}
      {!selectedSport && (
        <Card className="p-10 text-center">
          <Download size={36} className="text-text-muted mx-auto mb-3 opacity-30" />
          <p className="text-text-muted text-sm">Selecciona una competición para ver los próximos partidos</p>
        </Card>
      )}

      {loadingEvents && (
        <Card className="p-10 text-center">
          <RefreshCw size={28} className="text-accent animate-spin mx-auto mb-3" />
          <p className="text-text-muted text-sm">Cargando partidos...</p>
        </Card>
      )}

      {!loadingEvents && selectedSport && events.length === 0 && (
        <Card className="p-10 text-center">
          <AlertCircle size={28} className="text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-text-muted text-sm">No hay partidos próximos disponibles para esta competición</p>
        </Card>
      )}

      {!loadingEvents && events.length > 0 && (
        <div className="space-y-2">
          <p className="text-text-muted text-xs px-1">{events.length} partidos disponibles · cuotas promedio de {events[0]?.bookmakers_count ?? "—"} casas</p>
          {events.map((event) => {
            const already = importedIds.has(event.api_id);
            const importing = importingId === event.api_id;
            return (
              <Card key={event.api_id} className={`p-4 ${already ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-4">
                  {/* Sport icon + date */}
                  <div className="hidden sm:flex flex-col items-center gap-1 w-14 shrink-0 text-center">
                    <span className="text-2xl">{getSportIcon(event.our_sport as Sport)}</span>
                    <span className="text-text-muted text-[10px] leading-tight">{formatDate(event.commence_time).split(",")[0]}</span>
                  </div>

                  {/* Teams + date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-semibold text-sm truncate">
                      {event.home_team} <span className="text-text-muted font-normal">vs</span> {event.away_team}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">{formatDate(event.commence_time)}</p>
                  </div>

                  {/* Odds */}
                  <div className="flex gap-1.5 shrink-0">
                    <div className="flex flex-col items-center bg-surface-2 rounded-lg px-2.5 py-1.5 min-w-[46px]">
                      <span className="text-[10px] text-text-muted">1</span>
                      <span className="text-accent font-bold text-sm">{formatOdds(event.home_odds)}</span>
                    </div>
                    {event.draw_odds && (
                      <div className="flex flex-col items-center bg-surface-2 rounded-lg px-2.5 py-1.5 min-w-[46px]">
                        <span className="text-[10px] text-text-muted">X</span>
                        <span className="text-text-primary font-bold text-sm">{formatOdds(event.draw_odds)}</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center bg-surface-2 rounded-lg px-2.5 py-1.5 min-w-[46px]">
                      <span className="text-[10px] text-text-muted">2</span>
                      <span className="text-accent font-bold text-sm">{formatOdds(event.away_odds)}</span>
                    </div>
                  </div>

                  {/* Import button */}
                  <div className="shrink-0">
                    {already ? (
                      <div className="flex items-center gap-1.5 text-accent text-xs font-medium">
                        <CheckCircle size={15} /> Importado
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => importEvent(event)}
                        loading={importing}
                        disabled={importing}
                      >
                        <Download size={14} />
                        Importar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
