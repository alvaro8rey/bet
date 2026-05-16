import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { formatPoints, formatPointsCompact, formatDate, getWinRateColor, getSportIcon } from "@/utils";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { ReferralCard } from "@/components/profile/ReferralCard";
import Link from "next/link";
import { Flame, Star, TrendingUp, TrendingDown } from "lucide-react";

const SPORT_LABELS: Record<string, string> = {
  football: "Fútbol",
  basketball: "Baloncesto",
  tennis: "Tenis",
  baseball: "Béisbol",
  volleyball: "Voleibol",
  other: "Otro",
};

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

  const wonBets    = bets?.filter((b) => b.status === "won")     ?? [];
  const lostBets   = bets?.filter((b) => b.status === "lost")    ?? [];
  const settled    = bets?.filter((b) => b.status !== "pending") ?? [];

  const totalWon  = wonBets.reduce((acc, b) => acc + b.potential_win, 0);
  const totalLost = lostBets.reduce((acc, b) => acc + b.amount, 0);
  const netBalance = totalWon - totalLost;

  const winRate = profile?.total_bets > 0
    ? Math.round((profile.won_bets / profile.total_bets) * 100)
    : 0;

  // — Current streak (from most recent settled bets) —
  let currentStreak = 0;
  let streakIsWin   = true;
  for (const bet of settled) {
    if (currentStreak === 0) {
      streakIsWin = bet.status === "won";
      currentStreak = 1;
    } else if ((bet.status === "won") === streakIsWin) {
      currentStreak++;
    } else {
      break;
    }
  }

  // — Best win streak (chronological) —
  let bestStreak = 0;
  let tempStreak = 0;
  for (const bet of [...settled].reverse()) {
    if (bet.status === "won") { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak); }
    else tempStreak = 0;
  }

  // — Favorite sport —
  const sportCounts: Record<string, number> = {};
  settled.forEach((bet) => {
    const s = bet.event?.sport || "other";
    sportCounts[s] = (sportCounts[s] || 0) + 1;
  });
  const favoriteSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // — Sport breakdown —
  const sportStats: Record<string, { total: number; won: number }> = {};
  settled.forEach((bet) => {
    const sport = bet.event?.sport || "other";
    if (!sportStats[sport]) sportStats[sport] = { total: 0, won: 0 };
    sportStats[sport].total++;
    if (bet.status === "won") sportStats[sport].won++;
  });

  const streakLabel = currentStreak === 0
    ? "—"
    : `${streakIsWin ? "+" : "-"}${currentStreak}`;
  const streakColor = currentStreak === 0
    ? "text-text-muted"
    : streakIsWin ? "text-win" : "text-loss";

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <Card className="p-6 relative">
        {profile && <ProfileEditor profile={profile} email={user.email ?? ""} />}
        {/* Mobile: points + logout */}
        <div className="sm:hidden mt-4 pt-4 border-t border-border space-y-3">
          <Link href="/earn" className="block text-center group">
            <p className="text-accent font-bold text-3xl group-hover:text-accent/80 transition-colors">{formatPoints(profile?.points || 0)}</p>
            <p className="text-text-muted text-sm group-hover:text-accent/60 transition-colors">puntos actuales ↗</p>
          </Link>
          <div className="flex justify-center"><LogoutButton /></div>
        </div>
      </Card>

      {/* ── Stats ── */}
      <Card className="p-5">
        <h2 className="font-display font-bold text-base text-text-muted uppercase tracking-wide mb-4">Estadísticas</h2>

        {/* Row 1: basic */}
        <div className="grid grid-cols-4 gap-2 mb-4 pb-4 border-b border-border">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-text-primary">{profile?.total_bets || 0}</p>
            <p className="text-text-muted text-[11px] mt-0.5">Apuestas</p>
          </div>
          <div className="text-center">
            <p className={`text-xl sm:text-2xl font-bold ${getWinRateColor(winRate)}`}>{winRate}%</p>
            <p className="text-text-muted text-[11px] mt-0.5">% Éxito</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-win">{profile?.won_bets || 0}</p>
            <p className="text-text-muted text-[11px] mt-0.5">Ganadas</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-loss">{profile?.lost_bets || 0}</p>
            <p className="text-text-muted text-[11px] mt-0.5">Perdidas</p>
          </div>
        </div>

        {/* Row 2: advanced */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Racha actual */}
          <div className="flex items-center gap-3 bg-surface-2 rounded-xl px-3 py-3">
            <Flame size={18} className={currentStreak > 0 && streakIsWin ? "text-orange-400" : "text-text-muted"} />
            <div className="min-w-0">
              <p className={`font-bold text-base leading-tight ${streakColor}`}>{streakLabel}</p>
              <p className="text-text-muted text-[11px]">Racha actual</p>
            </div>
          </div>

          {/* Mejor racha */}
          <div className="flex items-center gap-3 bg-surface-2 rounded-xl px-3 py-3">
            <Star size={18} className="text-gold" />
            <div className="min-w-0">
              <p className="font-bold text-base leading-tight text-text-primary">{bestStreak > 0 ? `+${bestStreak}` : "—"}</p>
              <p className="text-text-muted text-[11px]">Mejor racha</p>
            </div>
          </div>

          {/* Deporte favorito */}
          <div className="flex items-center gap-3 bg-surface-2 rounded-xl px-3 py-3">
            <span className="text-xl leading-none">{favoriteSport ? getSportIcon(favoriteSport as any) : "🎯"}</span>
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight text-text-primary truncate">
                {favoriteSport ? (SPORT_LABELS[favoriteSport] ?? favoriteSport) : "—"}
              </p>
              <p className="text-text-muted text-[11px]">Deporte fav.</p>
            </div>
          </div>

          {/* Beneficio neto */}
          <div className="flex items-center gap-3 bg-surface-2 rounded-xl px-3 py-3">
            {netBalance >= 0
              ? <TrendingUp size={18} className="text-win flex-shrink-0" />
              : <TrendingDown size={18} className="text-loss flex-shrink-0" />
            }
            <div className="min-w-0">
              <p className={`font-bold text-sm leading-tight truncate ${netBalance >= 0 ? "text-win" : "text-loss"}`}
                 title={`${netBalance >= 0 ? "+" : ""}${formatPoints(netBalance)}`}>
                {netBalance >= 0 ? "+" : ""}{formatPointsCompact(netBalance)}
              </p>
              <p className="text-text-muted text-[11px]">Beneficio neto</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Balance ── */}
      <Card className="p-5">
        <h2 className="font-display font-bold text-base text-text-muted uppercase tracking-wide mb-4">Balance de puntos</h2>
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="text-center px-2">
            <p className="text-text-muted text-xs mb-1">Ganado</p>
            <p className="text-win font-bold text-lg sm:text-xl truncate" title={`+${formatPoints(totalWon)}`}>
              +{formatPointsCompact(totalWon)}
            </p>
            <p className="text-text-muted text-[10px] mt-0.5 hidden sm:block">{formatPoints(totalWon)} pts</p>
          </div>
          <div className="text-center px-2">
            <p className="text-text-muted text-xs mb-1">Perdido</p>
            <p className="text-loss font-bold text-lg sm:text-xl truncate" title={`-${formatPoints(totalLost)}`}>
              -{formatPointsCompact(totalLost)}
            </p>
            <p className="text-text-muted text-[10px] mt-0.5 hidden sm:block">{formatPoints(totalLost)} pts</p>
          </div>
          <div className="text-center px-2">
            <p className="text-text-muted text-xs mb-1">Neto</p>
            <p className={`font-bold text-lg sm:text-xl truncate ${netBalance >= 0 ? "text-win" : "text-loss"}`}
               title={`${netBalance >= 0 ? "+" : ""}${formatPoints(netBalance)}`}>
              {netBalance >= 0 ? "+" : ""}{formatPointsCompact(netBalance)}
            </p>
            <p className="text-text-muted text-[10px] mt-0.5 hidden sm:block">{formatPoints(netBalance)} pts</p>
          </div>
        </div>
      </Card>

      {/* ── Por deporte ── */}
      {Object.keys(sportStats).length > 0 && (
        <Card className="p-5">
          <h2 className="font-display font-bold text-base text-text-muted uppercase tracking-wide mb-4">Por deporte</h2>
          <div className="space-y-3">
            {Object.entries(sportStats)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([sport, stats]) => {
                const rate = stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0;
                return (
                  <div key={sport}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getSportIcon(sport as any)}</span>
                        <span className="text-text-secondary text-sm capitalize">
                          {SPORT_LABELS[sport] ?? sport}
                        </span>
                      </div>
                      <span className={`text-xs font-medium ${getWinRateColor(rate)}`}>
                        {stats.won}/{stats.total} · {rate}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* ── Referral ── */}
      {profile?.referral_code && (
        <ReferralCard
          referralCode={profile.referral_code}
          referralCount={profile.referral_count ?? 0}
        />
      )}

    </div>
  );
}

export const dynamic = "force-dynamic";
