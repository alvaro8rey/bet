import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { formatPoints } from "@/utils";
import { Trophy } from "lucide-react";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, points, total_bets, won_bets, avatar_url")
    .order("won_bets", { ascending: false })
    .order("total_bets", { ascending: true })
    .limit(500);

  const allProfiles = profiles ?? [];
  const currentProfile = allProfiles.find((p) => p.user_id === user.id);
  const currentRank = currentProfile ? allProfiles.indexOf(currentProfile) + 1 : null;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-black text-3xl text-text-primary mb-1">Clasificación</h1>
        <p className="text-text-muted text-sm">Top predictores por apuestas acertadas</p>
      </div>

      {/* My rank card */}
      {currentProfile && currentRank && (
        <Card glow className="p-5">
          <div className="flex items-center gap-4">
            <Avatar username={currentProfile.username} avatarUrl={(currentProfile as any).avatar_url} size="lg" isMe />
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
              <p className="text-accent font-bold text-2xl">{currentProfile.won_bets}</p>
              <p className="text-text-muted text-xs">acertadas</p>
              <p className="text-text-muted text-[10px]">{formatPoints(currentProfile.points)} pts</p>
            </div>
          </div>
        </Card>
      )}

      {allProfiles.length === 0 ? (
        <Card className="p-10 text-center">
          <Trophy size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-primary font-semibold">Sin datos aún</p>
          <p className="text-text-muted text-sm">El ranking se llenará cuando los usuarios hagan predicciones.</p>
        </Card>
      ) : (
        <LeaderboardTable profiles={allProfiles} currentUserId={user.id} />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
