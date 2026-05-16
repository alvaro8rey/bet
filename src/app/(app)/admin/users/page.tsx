import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Users, TrendingUp, Coins } from "lucide-react";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { formatPoints } from "@/utils";
import { UsersTable } from "@/components/admin/UsersTable";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).single();
  if (!me?.is_admin) redirect("/dashboard");

  const admin = await createAdminClient();
  const [{ data: users }, { data: authData }] = await Promise.all([
    admin.from("profiles").select("user_id, username, points, total_bets, won_bets, lost_bets, referral_count, is_admin, created_at, avatar_url").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = Object.fromEntries((authData?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const allUsers = (users ?? []).map((u) => ({ ...u, email: emailMap[u.user_id] ?? "" }));
  const totalPoints = allUsers.reduce((acc, u) => acc + (u.points ?? 0), 0);
  const activeUsers = allUsers.filter((u) => u.total_bets > 0).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminBreadcrumb items={[{ label: "Usuarios" }]} />
      <div>
        <h1 className="font-display font-black text-3xl text-text-primary mb-1">Usuarios</h1>
        <p className="text-text-muted text-sm">{allUsers.length} usuarios registrados</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-accent" />
            <span className="text-text-muted text-xs">Total</span>
          </div>
          <p className="text-text-primary font-bold text-2xl">{allUsers.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-win" />
            <span className="text-text-muted text-xs">Con apuestas</span>
          </div>
          <p className="text-text-primary font-bold text-2xl">{activeUsers}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins size={16} className="text-gold" />
            <span className="text-text-muted text-xs">Pts en circulación</span>
          </div>
          <p className="text-text-primary font-bold text-2xl">{formatPoints(totalPoints)}</p>
        </Card>
      </div>

      <UsersTable initialUsers={allUsers} />
    </div>
  );
}

export const dynamic = "force-dynamic";
