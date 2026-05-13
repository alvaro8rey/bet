import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { formatPoints, getWinRateColor } from "@/utils";
import { Trophy, Medal } from "lucide-react";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, points, total_bets, won_bets")
    .order("points", { ascending: false })
    .limit(50);

  const currentProfile = profiles?.find((p) => p.user_id === user.id);
  const currentRank = currentProfile ? (profiles?.indexOf(currentProfile) ?? -1) + 1 : null;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display font-black text-3xl text-text-primary mb-1">Clasificación</h1>
          <p className="text-text-muted text-sm">Top predictores por puntos acumulados</p>
        </div>

        {/* My rank card */}
        {currentProfile && currentRank && (
          <Card glow className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-accent to-blue rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-background font-display font-black text-xl">
                  {currentProfile.username?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-text-muted text-xs font-medium mb-0.5">Tu posición</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getRankIcon(currentRank)}</span>
                  <p className="text-text-primary font-bold text-lg">{currentProfile.username}</p>
                </div>
                <p className="text-text-secondary text-xs mt-1">
                  {currentProfile.won_bets}/{currentProfile.total_bets} apuestas acertadas
                </p>
              </div>
              <div className="text-right">
                <p className="text-accent font-bold text-2xl">{formatPoints(currentProfile.points)}</p>
                <p className="text-text-muted text-xs">puntos</p>
              </div>
            </div>
          </Card>
        )}

        {/* Leaderboard */}
        <div className="space-y-2">
          {profiles?.map((profile, index) => {
            const rank = index + 1;
            const isMe = profile.user_id === user.id;
            const winRate = profile.total_bets > 0
              ? Math.round((profile.won_bets / profile.total_bets) * 100)
              : 0;

            return (
              <Card
                key={profile.user_id}
                className={`p-4 transition-all ${isMe ? "border-accent/30 bg-accent-muted/5" : ""}`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-black text-sm ${
                    rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                    rank === 2 ? "bg-gray-400/20 text-gray-300" :
                    rank === 3 ? "bg-orange-500/20 text-orange-400" :
                    "bg-surface-2 text-text-muted border border-border"
                  }`}>
                    {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : `#${rank}`}
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isMe ? "bg-gradient-to-br from-accent to-blue" : "bg-surface-3"
                  }`}>
                    <span className={`font-bold text-sm ${isMe ? "text-background" : "text-text-secondary"}`}>
                      {profile.username?.[0]?.toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm ${isMe ? "text-accent" : "text-text-primary"}`}>
                        {profile.username}
                      </p>
                      {isMe && <span className="text-xs text-accent/60 font-medium">(tú)</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-text-muted text-xs">{profile.total_bets} apuestas</p>
                      <p className={`text-xs font-medium ${getWinRateColor(winRate)}`}>{winRate}% éxito</p>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className={`font-bold text-base ${rank <= 3 ? "text-accent" : "text-text-primary"}`}>
                      {formatPoints(profile.points)}
                    </p>
                    <p className="text-text-muted text-xs">pts</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {(!profiles || profiles.length === 0) && (
          <Card className="p-10 text-center">
            <Trophy size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-primary font-semibold">Sin datos aún</p>
            <p className="text-text-muted text-sm">El ranking se llenará cuando los usuarios hagan predicciones.</p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

export const dynamic = "force-dynamic";
