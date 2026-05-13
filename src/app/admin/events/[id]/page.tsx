"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import type { Event, BetResult } from "@/types";
import { resolveEvent } from "../actions";

const RESULT_OPTIONS = [
  { value: "home", label: "Victoria Local (1)" },
  { value: "draw", label: "Empate (X)" },
  { value: "away", label: "Victoria Visitante (2)" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "live", label: "En Directo" },
  { value: "finished", label: "Finalizado" },
  { value: "cancelled", label: "Cancelado" },
];

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);

  const [form, setForm] = useState({
    competition: "",
    home_team: "",
    away_team: "",
    home_odds: "",
    draw_odds: "",
    away_odds: "",
    event_date: "",
    status: "pending",
    home_score: "",
    away_score: "",
    result: "",
  });

  useEffect(() => {
    const fetchEvent = async () => {
      const { data } = await supabase.from("events").select("*").eq("id", id).single();
      if (data) {
        setEvent(data);
        setForm({
          competition: data.competition,
          home_team: data.home_team,
          away_team: data.away_team,
          home_odds: String(data.home_odds),
          draw_odds: data.draw_odds ? String(data.draw_odds) : "",
          away_odds: String(data.away_odds),
          event_date: data.event_date.slice(0, 16),
          status: data.status,
          home_score: data.home_score !== null ? String(data.home_score) : "",
          away_score: data.away_score !== null ? String(data.away_score) : "",
          result: data.result || "",
        });
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id, supabase]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("events").update({
      competition: form.competition,
      home_team: form.home_team,
      away_team: form.away_team,
      home_odds: parseFloat(form.home_odds),
      draw_odds: form.draw_odds ? parseFloat(form.draw_odds) : null,
      away_odds: parseFloat(form.away_odds),
      event_date: form.event_date,
      status: form.status as Event["status"],
    }).eq("id", id);

    if (error) toast.error("Error: " + error.message);
    else toast.success("Evento actualizado");
    setSaving(false);
  };

  const handleResolve = async () => {
    if (!form.result) {
      toast.error("Selecciona el resultado ganador");
      return;
    }

    setResolving(true);
    try {
      const result = form.result as BetResult;
      const homeScore = form.home_score !== "" ? parseInt(form.home_score) : null;
      const awayScore = form.away_score !== "" ? parseInt(form.away_score) : null;

      const response = await resolveEvent(id, result, homeScore, awayScore);

      if (!response.success) {
        toast.error(response.message);
        setResolving(false);
        return;
      }

      toast.success(response.message);
      router.push("/admin");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al resolver");
      setResolving(false);
    }
  };

  if (loading) return <AppLayout><PageLoader /></AppLayout>;
  if (!event) return <AppLayout><p className="text-text-muted">Evento no encontrado</p></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm"><ArrowLeft size={16} /> Volver</Button>
          </Link>
          <div>
            <h1 className="font-display font-black text-3xl text-text-primary">Editar Evento</h1>
            <p className="text-text-muted text-sm">{event.home_team} vs {event.away_team}</p>
          </div>
        </div>

        {/* Edit form */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-text-primary">Detalles</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input label="Competición" value={form.competition} onChange={(e) => update("competition", e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Local" value={form.home_team} onChange={(e) => update("home_team", e.target.value)} />
              <Input label="Visitante" value={form.away_team} onChange={(e) => update("away_team", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Cuota Local" type="number" step="0.01" value={form.home_odds} onChange={(e) => update("home_odds", e.target.value)} />
              <Input label="Cuota Empate" type="number" step="0.01" value={form.draw_odds} onChange={(e) => update("draw_odds", e.target.value)} />
              <Input label="Cuota Visit." type="number" step="0.01" value={form.away_odds} onChange={(e) => update("away_odds", e.target.value)} />
            </div>
            <Input label="Fecha" type="datetime-local" value={form.event_date} onChange={(e) => update("event_date", e.target.value)} />
            <Select label="Estado" value={form.status} onChange={(e) => update("status", e.target.value)} options={STATUS_OPTIONS} />

            <Button onClick={handleSave} loading={saving} fullWidth variant="secondary">
              Guardar cambios
            </Button>
          </CardBody>
        </Card>

        {/* Resolve */}
        {event.status !== "finished" && event.status !== "cancelled" && (
          <Card className="border-accent/20">
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Resolver Evento</h2>
              <p className="text-text-muted text-xs mt-0.5">
                Esto marcará el evento como finalizado y procesará todas las apuestas pendientes.
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`Goles/Puntos ${event.home_team}`}
                  type="number"
                  min="0"
                  value={form.home_score}
                  onChange={(e) => update("home_score", e.target.value)}
                  placeholder="0"
                />
                <Input
                  label={`Goles/Puntos ${event.away_team}`}
                  type="number"
                  min="0"
                  value={form.away_score}
                  onChange={(e) => update("away_score", e.target.value)}
                  placeholder="0"
                />
              </div>

              <Select
                label="Resultado ganador *"
                value={form.result}
                onChange={(e) => update("result", e.target.value)}
                options={[
                  { value: "", label: "Selecciona resultado..." },
                  { value: "home", label: `Victoria Local (${event.home_team})` },
                  ...(event.draw_odds ? [{ value: "draw", label: "Empate" }] : []),
                  { value: "away", label: `Victoria Visitante (${event.away_team})` },
                ]}
              />

              <div className="bg-pending/10 border border-pending/20 rounded-xl p-3 text-xs text-pending">
                ⚠️ Esta acción es irreversible. Se procesarán todas las apuestas pendientes automáticamente.
              </div>

              <Button
                onClick={handleResolve}
                loading={resolving}
                fullWidth
                className="bg-gradient-to-r from-accent to-accent-dim"
              >
                <CheckCircle size={16} />
                Finalizar y resolver apuestas
              </Button>
            </CardBody>
          </Card>
        )}

        {event.status === "finished" && (
          <Card className="p-4 border-win/20">
            <div className="flex items-center gap-2 text-win">
              <CheckCircle size={18} />
              <p className="font-semibold">Evento ya finalizado</p>
            </div>
            <p className="text-text-muted text-sm mt-1">
              Resultado: {RESULT_OPTIONS.find((r) => r.value === event.result)?.label || event.result}
              {event.home_score !== null && ` · ${event.home_score} - ${event.away_score}`}
            </p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

export const dynamic = "force-dynamic";
