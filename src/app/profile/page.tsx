import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { formatPoints, formatDate, getWinRateColor } from "@/utils";
import { LogoutButton } from "@/components/profile/LogoutButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: bets } = await supabase
    .from("bets")
    .select("*, event:events(sport, competition)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const wonBets = bets?.filter((b) => b.status === "won") || [];
  const lostBets = bets?.filter((b) => b.status === "lost") || [];
  const pendingBets = bets?.filter((b) => b.status === "pending") || [];

  const totalWon = wonBets.reduce((acc, b) => acc + b.potential_win, 0);
  const totalLost = lostBets.reduce((acc, b) => acc + b.amount, 0);
  const netBalance = totalWon - totalLost;

  const winRate = profile && profile.total_bets > 0
    ? Math.round((profile.won_bets / profile.total_bets) * 100)
    : 0;

  // Sport breakdown
  const sportStats: Record<string, { total: number; won: number }> = {};
  bets?.filter(b => b.status !== "pending").forEach((bet) => {
    const sport = bet.event?.sport || "other";
    if (!sportStats[sport]) sportStats[sport] = { total: 0, won: 0 };
    sportStats[sport].total++;
    if (bet.status === "won") sportStats[sport].won++;
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Profile header */}
        <Card className="p-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gradient-to-br from-accent to-blue rounded-2xl flex items-center justify-center flex-shrink-0 shadow-accent">
              <span className="text-background font-display font-black text-3xl">
                {profile?.username?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-display font-black text-3xl text-text-primary">{profile?.username}</h1>
              <p className="text-text-muted text-sm">{user.email}</p>
              <p className="text-text-muted text-xs mt-1">
                Miembro desde {profile ? formatDate(profile.created_at) : "—"}
              </p>
              {profile?.is_admin && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-blue-muted border border-blue/20 text-blue text-xs rounded-lg font-medium">
                  👑 Admin
                </span>
              )}
            </div>
            <div className="ml-auto flex flex-col items-end gap-3 hidden sm:flex">
              <LogoutButton />
              <div className="text-right">
                <p className="text-accent font-bold text-3xl">{formatPoints(profile?.points || 0)}</p>
                <p className="text-text-muted text-sm">puntos actuales</p>
              </div>
            </div>
          </div>
          {/* Mobile points & logout */}
          <div className="sm:hidden mt-4 pt-4 border-t border-border space-y-3">
            <div className="text-center">
              <p className="text-accent font-bold text-3xl">{formatPoints(profile?.points || 0)}</p>
              <p className="text-text-muted text-sm">puntos actuales</p>
            </div>
            <div className="flex justify-center">
              <LogoutButton />
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">{profile?.total_bets || 0}</p>
            <p className="text-text-muted text-xs mt-1">Total apuestas</p>
          </Card>
          <Card className="p-4 text-center">
            <p className={`text-2xl font-bold ${getWinRateColor(winRate)}`}>{winRate}%</p>
            <p className="text-text-muted text-xs mt-1">% Éxito</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-win">{profile?.won_bets || 0}</p>
            <p className="text-text-muted text-xs mt-1">Ganadas</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-loss">{profile?.lost_bets || 0}</p>
            <p className="text-text-muted text-xs mt-1">Perdidas</p>
          </Card>
        </div>

        {/* P&L */}
        <Card className="p-5">
          <h2 className="font-display font-bold text-lg text-text-primary mb-4">Balance de puntos</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-text-muted text-xs mb-1">Ganado</p>
              <p className="text-win font-bold text-xl">+{formatPoints(totalWon)}</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-text-muted text-xs mb-1">Perdido</p>
              <p className="text-loss font-bold text-xl">-{formatPoints(totalLost)}</p>
            </div>
            <div className="text-center">
              <p className="text-text-muted text-xs mb-1">Neto</p>
              <p className={`font-bold text-xl ${netBalance >= 0 ? "text-win" : "text-loss"}`}>
                {netBalance >= 0 ? "+" : ""}{formatPoints(netBalance)}
              </p>
            </div>
          </div>
        </Card>

        {/* Sport breakdown */}
        {Object.keys(sportStats).length > 0 && (
          <Card className="p-5">
            <h2 className="font-display font-bold text-lg text-text-primary mb-4">Por deporte</h2>
            <div className="space-y-3">
              {Object.entries(sportStats).map(([sport, stats]) => {
                const rate = stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0;
                return (
                  <div key={sport} className="flex items-center gap-3">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-text-secondary text-sm capitalize">{sport}</span>
                        <span className={`text-xs font-medium ${getWinRateColor(rate)}`}>{stats.won}/{stats.total} ({rate}%)</span>
                      </div>
                      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

export const dynamic = "force-dynamic";
