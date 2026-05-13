import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Reward {
  id: number;
  nombre: string;
  puntos_necesarios: number;
  valor_euros: number;
  categoria: "digital" | "fisico";
  imagen_url?: string;
}

export default async function AdminRewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: rewards } = await supabase
    .from("rewards")
    .select("*")
    .order("puntos_necesarios", { ascending: true });

  const digitalRewards = rewards?.filter((r) => r.categoria === "digital") || [];
  const fisicosRewards = rewards?.filter((r) => r.categoria === "fisico") || [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-3xl text-text-primary mb-1">Gestión de Premios</h1>
            <p className="text-text-muted text-sm">Crea, edita y elimina premios disponibles</p>
          </div>
          <Link href="/admin/rewards/new">
            <Button>
              <Plus size={16} />
              Nuevo Premio
            </Button>
          </Link>
        </div>

        {/* Digital Rewards */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-text-primary">Premios Digitales</h2>
          {digitalRewards.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-text-muted">No hay premios digitales creados</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {digitalRewards.map((reward) => (
                <RewardCard key={reward.id} reward={reward} />
              ))}
            </div>
          )}
        </div>

        {/* Physical Rewards */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-text-primary">Premios Físicos</h2>
          {fisicosRewards.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-text-muted">No hay premios físicos creados</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fisicosRewards.map((reward) => (
                <RewardCard key={reward.id} reward={reward} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function RewardCard({ reward }: { reward: Reward }) {
  return (
    <Card className="overflow-hidden">
      {reward.imagen_url && (
        <div className="relative w-full h-40 overflow-hidden bg-surface-2">
          <img
            src={reward.imagen_url}
            alt={reward.nombre}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-text-primary mb-1">{reward.nombre}</h3>
          <p className="text-sm text-text-muted">{reward.puntos_necesarios.toLocaleString()} pts</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-accent font-semibold">{reward.valor_euros}€</span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              reward.categoria === "digital"
                ? "bg-blue/15 text-blue"
                : "bg-gold/15 text-gold"
            }`}
          >
            {reward.categoria === "digital" ? "Digital" : "Físico"}
          </span>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Link href={`/admin/rewards/${reward.id}`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full">
              <Edit size={14} />
              Editar
            </Button>
          </Link>
          <button className="px-3 py-1.5 rounded-lg bg-loss/10 text-loss hover:bg-loss/20 transition text-sm font-medium">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
}

export const dynamic = "force-dynamic";
