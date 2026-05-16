"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { formatPoints, getWinRateColor } from "@/utils";

interface Profile {
  user_id: string;
  username: string;
  points: number;
  total_bets: number;
  won_bets: number;
  avatar_url: string | null;
}

const PAGE_SIZES = [20, 50, 100] as const;

export function LeaderboardTable({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(profiles.length / pageSize);
  const slice = profiles.slice(page * pageSize, page * pageSize + pageSize);

  const handlePageSize = (size: 20 | 50 | 100) => {
    setPageSize(size);
    setPage(0);
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-xs">{profiles.length} usuarios</p>
        <div className="flex items-center gap-1.5">
          <span className="text-text-muted text-xs">Mostrar:</span>
          {PAGE_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => handlePageSize(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                pageSize === s
                  ? "bg-accent text-background"
                  : "bg-surface-2 text-text-muted hover:text-text-primary border border-border"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {slice.map((profile, i) => {
          const rank = page * pageSize + i + 1;
          const isMe = profile.user_id === currentUserId;
          const winRate = profile.total_bets > 0
            ? Math.round((profile.won_bets / profile.total_bets) * 100)
            : 0;

          return (
            <Card
              key={profile.user_id}
              className={`px-4 py-3 transition-all ${isMe ? "border-accent/30 bg-accent/5" : ""}`}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className={`w-8 text-center flex-shrink-0 font-display font-black text-sm ${
                  rank === 1 ? "text-yellow-400" :
                  rank === 2 ? "text-gray-300" :
                  rank === 3 ? "text-orange-400" :
                  "text-text-muted"
                }`}>
                  {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
                </div>

                {/* Avatar */}
                <Avatar username={profile.username} avatarUrl={profile.avatar_url} size="sm" isMe={isMe} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`font-semibold text-sm truncate ${isMe ? "text-accent" : "text-text-primary"}`}>
                      {profile.username}
                    </p>
                    {isMe && <span className="text-xs text-accent/60 font-medium flex-shrink-0">(tú)</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-text-muted text-xs">{profile.total_bets} apuestas</span>
                    <span className={`text-xs font-medium ${getWinRateColor(winRate)}`}>{winRate}%</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-sm ${rank <= 3 ? "text-accent" : "text-text-primary"}`}>
                    {profile.won_bets} <span className="text-text-muted font-normal text-xs">acertadas</span>
                  </p>
                  <p className="text-text-muted text-xs">{formatPoints(profile.points)} pts</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-sm bg-surface-2 border border-border text-text-secondary disabled:opacity-40 hover:bg-surface-3 transition"
          >
            ← Anterior
          </button>
          <span className="text-text-muted text-sm">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-surface-2 border border-border text-text-secondary disabled:opacity-40 hover:bg-surface-3 transition"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
