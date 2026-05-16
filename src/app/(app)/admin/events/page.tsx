import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import Link from "next/link";
import { formatPoints, getSportIcon, formatDateShort, getEventStatusLabel } from "@/utils";
import { Plus, Download } from "lucide-react";

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false })
    .limit(200);

  const pending = events?.filter((e) => e.status === "pending") ?? [];
  const live = events?.filter((e) => e.status === "live") ?? [];
  const finished = events?.filter((e) => e.status === "finished") ?? [];
  const cancelled = events?.filter((e) => e.status === "cancelled") ?? [];

  const groups = [
    { label: "En directo", items: live, color: "text-loss" },
    { label: "Pendientes", items: pending, color: "text-pending" },
    { label: "Finalizados", items: finished, color: "text-text-muted" },
    { label: "Cancelados", items: cancelled, color: "text-text-muted" },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminBreadcrumb items={[{ label: "Eventos" }]} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-3xl text-text-primary mb-1">Eventos</h1>
          <p className="text-text-muted text-sm">{events?.length ?? 0} eventos en total</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/import">
            <Button variant="secondary">
              <Download size={16} />
              Importar
            </Button>
          </Link>
          <Link href="/admin/events/new">
            <Button>
              <Plus size={16} />
              Nuevo evento
            </Button>
          </Link>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.label}>
          <h2 className={`font-display font-bold text-lg mb-3 ${group.color}`}>
            {group.label} <span className="text-text-muted font-normal text-base">({group.items.length})</span>
          </h2>
          <div className="space-y-2">
            {group.items.map((event) => (
              <Card key={event.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{getSportIcon(event.sport)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-semibold text-sm truncate">
                      {event.home_team} vs {event.away_team}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-text-muted text-xs">{event.competition}</p>
                      <span className="text-text-muted text-xs">·</span>
                      <p className="text-text-muted text-xs">{formatDateShort(event.event_date)}</p>
                      {event.result && (
                        <>
                          <span className="text-text-muted text-xs">·</span>
                          <p className="text-accent text-xs font-medium">
                            {event.home_score ?? "?"}-{event.away_score ?? "?"} ({event.result})
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                      event.status === "pending" ? "bg-pending/10 text-pending" :
                      event.status === "live" ? "bg-loss/10 text-loss" :
                      "bg-surface-3 text-text-muted"
                    }`}>
                      {getEventStatusLabel(event.status)}
                    </span>
                    <Link href={`/admin/events/${event.id}`}>
                      <Button variant="secondary" size="sm">Editar</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {(!events || events.length === 0) && (
        <Card className="p-10 text-center">
          <p className="text-text-primary font-semibold mb-2">Sin eventos</p>
          <p className="text-text-muted text-sm mb-4">Importa eventos desde la API o créalos manualmente</p>
          <Link href="/admin/events/new">
            <Button><Plus size={16} /> Crear primer evento</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
