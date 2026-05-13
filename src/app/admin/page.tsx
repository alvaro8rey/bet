import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatPoints, getSportIcon, formatDateShort, getEventStatusLabel } from "@/utils";
import { Plus, Users, Calendar, Ticket, Gift, Package } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const [{ data: events }, { data: bets }, { count: usersCount }, { data: redemptions }] = await Promise.all([
    supabase.from("events").select("*").order("event_date", { ascending: false }).limit(10),
    supabase.from("bets").select("id, status").neq("status", "cancelled"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("redemptions").select("id, status").order("created_at", { ascending: false }).limit(100),
  ]);

  const pendingEvents = events?.filter((e) => e.status === "pending").length || 0;
  const pendingBets = bets?.filter((b) => b.status === "pending").length || 0;
  const pendingRedemptions = redemptions?.filter((r) => r.status === "pending").length || 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-3xl text-text-primary mb-1">Panel Admin</h1>
            <p className="text-text-muted text-sm">Gestión de eventos, premios y resultados</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/rewards">
              <Button variant="secondary">
                <Package size={16} />
                Gestionar Premios
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

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-blue" />
              <span className="text-text-muted text-xs">Usuarios</span>
            </div>
            <p className="text-text-primary font-bold text-2xl">{usersCount || 0}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-accent" />
              <span className="text-text-muted text-xs">Eventos</span>
            </div>
            <p className="text-text-primary font-bold text-2xl">{events?.length || 0}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-pending" />
              <span className="text-text-muted text-xs">Pendientes</span>
            </div>
            <p className="text-pending font-bold text-2xl">{pendingEvents}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ticket size={16} className="text-text-muted" />
              <span className="text-text-muted text-xs">Apuestas activas</span>
            </div>
            <p className="text-text-primary font-bold text-2xl">{pendingBets}</p>
          </Card>
          <Card className="p-4">
            <Link href="/admin/redemptions" className="flex items-center gap-2 mb-2 hover:text-accent transition">
              <Gift size={16} className="text-gold" />
              <span className="text-text-muted text-xs">Canjes</span>
            </Link>
            <p className="text-text-primary font-bold text-2xl">{pendingRedemptions}</p>
          </Card>
        </div>

        {/* Events list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-text-primary">Todos los Eventos</h2>
            <Link href="/admin/events/new">
              <Button variant="secondary" size="sm">
                <Plus size={14} />
                Crear
              </Button>
            </Link>
          </div>

          <div className="space-y-2">
            {events?.map((event) => (
              <Card key={event.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getSportIcon(event.sport)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-semibold text-sm">
                      {event.home_team} vs {event.away_team}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-text-muted text-xs">{event.competition}</p>
                      <p className="text-text-muted text-xs">·</p>
                      <p className="text-text-muted text-xs">{formatDateShort(event.event_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                      event.status === "pending" ? "bg-pending/10 text-pending" :
                      event.status === "live" ? "bg-loss/10 text-loss" :
                      event.status === "finished" ? "bg-surface-3 text-text-muted" :
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
      </div>
    </AppLayout>
  );
}

export const dynamic = "force-dynamic";
