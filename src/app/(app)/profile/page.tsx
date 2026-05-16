import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { formatPoints, formatPointsCompact, formatDate, getWinRateColor } from "@/utils";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { ReferralCard } from "@/components/profile/ReferralCard";
import Link from "next/link";

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
      <div className="space-y-6 animate-fade-in">
        {/* Profile header */}
        <Card className="p-6 relative">
          {profile && <ProfileEditor profile={profile} email={user.email ?? ""} />}
          {/* Mobile points & logout */}
          <div className="sm:hidden mt-4 pt-4 border-t border-border space-y-3">
            <Link href="/earn" className="block text-center group">
              <p className="text-accent font-bold text-3xl group-hover:text-accent/80 transition-colors">{formatPoints(profile?.points || 0)}</p>
              <p className="text-text-muted text-sm group-hover:text-accent/60 transition-colors">puntos actuales ↗</p>
            </Link>
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
          <div className="grid grid-cols-3 gap-1 sm:gap-4">
            <div className="text-center min-w-0 overflow-hidden px-1">
              <p className="text-text-muted text-xs mb-1 truncate">Ganado</p>
              <p className="text-win font-bold text-sm sm:text-xl truncate" title={`+${formatPoints(totalWon)}`}>
                +{formatPointsCompact(totalWon)}
              </p>
              <p className="text-text-muted text-[10px] hidden sm:block">{formatPoints(totalWon)} pts</p>
            </div>
            <div className="text-center min-w-0 overflow-hidden border-x border-border px-1">
              <p className="text-text-muted text-xs mb-1 truncate">Perdido</p>
              <p className="text-loss font-bold text-sm sm:text-xl truncate" title={`-${formatPoints(totalLost)}`}>
                -{formatPointsCompact(totalLost)}
              </p>
              <p className="text-text-muted text-[10px] hidden sm:block">{formatPoints(totalLost)} pts</p>
            </div>
            <div className="text-center min-w-0 overflow-hidden px-1">
              <p className="text-text-muted text-xs mb-1 truncate">Neto</p>
              <p className={`font-bold text-sm sm:text-xl truncate ${netBalance >= 0 ? "text-win" : "text-loss"}`}
                 title={`${netBalance >= 0 ? "+" : ""}${formatPoints(netBalance)}`}>
                {netBalance >= 0 ? "+" : ""}{formatPointsCompact(netBalance)}
              </p>
              <p className="text-text-muted text-[10px] hidden sm:block">{formatPoints(netBalance)} pts</p>
            </div>
          </div>
        </Card>

        {/* Referral */}
        {profile?.referral_code && (
          <ReferralCard
            referralCode={profile.referral_code}
            referralCount={profile.referral_count ?? 0}
          />
        )}

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
  );
}

export const dynamic = "force-dynamic";
