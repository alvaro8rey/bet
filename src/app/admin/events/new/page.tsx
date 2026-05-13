"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Sport } from "@/types";

const SPORT_OPTIONS = [
  { value: "football", label: "⚽ Fútbol" },
  { value: "tennis", label: "🎾 Tenis" },
  { value: "basketball", label: "🏀 Baloncesto" },
  { value: "baseball", label: "⚾ Béisbol" },
  { value: "volleyball", label: "🏐 Voleibol" },
  { value: "other", label: "🏆 Otro" },
];

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    sport: "football" as Sport,
    competition: "",
    home_team: "",
    away_team: "",
    home_odds: "",
    draw_odds: "",
    away_odds: "",
    event_date: "",
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.competition || !form.home_team || !form.away_team || !form.home_odds || !form.away_odds || !form.event_date) {
      toast.error("Rellena todos los campos obligatorios");
      return;
    }
    if (parseFloat(form.home_odds) <= 1 || parseFloat(form.away_odds) <= 1) {
      toast.error("Las cuotas deben ser mayores que 1.00");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("events").insert({
      sport: form.sport,
      competition: form.competition.trim(),
      home_team: form.home_team.trim(),
      away_team: form.away_team.trim(),
      home_odds: parseFloat(form.home_odds),
      draw_odds: form.draw_odds ? parseFloat(form.draw_odds) : null,
      away_odds: parseFloat(form.away_odds),
      event_date: form.event_date,
      status: "pending",
      home_score: null,
      away_score: null,
      result: null,
    });

    if (error) {
      toast.error("Error al crear el evento: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("¡Evento creado correctamente!");
    router.push("/admin");
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="font-display font-black text-3xl text-text-primary">Nuevo Evento</h1>
            <p className="text-text-muted text-sm">Crea un evento deportivo para predicciones</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Información del evento</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Select
                label="Deporte"
                value={form.sport}
                onChange={(e) => update("sport", e.target.value)}
                options={SPORT_OPTIONS}
              />
              <Input
                label="Competición *"
                value={form.competition}
                onChange={(e) => update("competition", e.target.value)}
                placeholder="LaLiga, Wimbledon, NBA..."
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Equipo/Jugador Local *"
                  value={form.home_team}
                  onChange={(e) => update("home_team", e.target.value)}
                  placeholder="Real Madrid"
                />
                <Input
                  label="Equipo/Jugador Visitante *"
                  value={form.away_team}
                  onChange={(e) => update("away_team", e.target.value)}
                  placeholder="FC Barcelona"
                />
              </div>
              <Input
                label="Fecha y hora del evento *"
                type="datetime-local"
                value={form.event_date}
                onChange={(e) => update("event_date", e.target.value)}
              />
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Cuotas</h2>
              <p className="text-text-muted text-xs mt-0.5">Deben ser mayores que 1.00</p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Cuota Local (1) *"
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={form.home_odds}
                  onChange={(e) => update("home_odds", e.target.value)}
                  placeholder="1.85"
                />
                <Input
                  label="Cuota Empate (X)"
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={form.draw_odds}
                  onChange={(e) => update("draw_odds", e.target.value)}
                  placeholder="3.40 (opcional)"
                />
                <Input
                  label="Cuota Visitante (2) *"
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={form.away_odds}
                  onChange={(e) => update("away_odds", e.target.value)}
                  placeholder="4.20"
                />
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-3 mt-6">
            <Button type="submit" size="lg" loading={loading} fullWidth>
              Crear evento
            </Button>
            <Link href="/admin" className="flex-1">
              <Button type="button" variant="secondary" size="lg" fullWidth>
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export const dynamic = "force-dynamic";
