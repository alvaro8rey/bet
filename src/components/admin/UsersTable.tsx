"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatPoints, formatDate } from "@/utils";
import { Shield, ShieldOff, Edit2, Check, X } from "lucide-react";
import toast from "react-hot-toast";

interface UserProfile {
  user_id: string;
  username: string;
  points: number;
  total_bets: number;
  won_bets: number;
  lost_bets: number;
  referral_count: number;
  is_admin: boolean;
  created_at: string;
  avatar_url: string | null;
}

interface Props {
  initialUsers: UserProfile[];
}

export function UsersTable({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const updateUser = async (userId: string, updates: { points?: number; is_admin?: boolean }) => {
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, ...data.profile } : u));
      toast.success("Usuario actualizado");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setLoading(null);
    }
  };

  const startEdit = (user: UserProfile) => {
    setEditingId(user.user_id);
    setEditPoints(String(user.points));
  };

  const confirmEdit = (userId: string) => {
    const pts = parseInt(editPoints);
    if (isNaN(pts) || pts < 0) { toast.error("Puntos inválidos"); return; }
    setEditingId(null);
    updateUser(userId, { points: pts });
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Buscar usuario..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition"
      />

      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-text-muted text-sm">No se encontraron usuarios</p>
          </Card>
        )}
        {filtered.map((user) => {
          const winRate = user.total_bets > 0 ? Math.round((user.won_bets / user.total_bets) * 100) : 0;
          const isEditing = editingId === user.user_id;
          const isLoading = loading === user.user_id;

          return (
            <Card key={user.user_id} className={`p-4 transition ${isLoading ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sm font-bold text-text-muted uppercase">{user.username[0]}</span>
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-text-primary font-semibold text-sm truncate">{user.username}</p>
                      {user.is_admin && (
                        <span className="text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded font-medium flex-shrink-0">ADMIN</span>
                      )}
                    </div>
                    <p className="text-text-muted text-xs">{formatDate(user.created_at)}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 text-center flex-shrink-0">
                  <div>
                    <p className="text-text-muted text-[10px] mb-0.5">Apuestas</p>
                    <p className="text-text-primary text-sm font-medium">{user.total_bets}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-[10px] mb-0.5">% Éxito</p>
                    <p className="text-sm font-medium" style={{ color: winRate >= 60 ? "var(--color-win)" : winRate >= 40 ? "var(--color-pending)" : "var(--color-loss)" }}>
                      {winRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted text-[10px] mb-0.5">Referidos</p>
                    <p className="text-text-primary text-sm font-medium">{user.referral_count ?? 0}</p>
                  </div>
                </div>

                {/* Points editable */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <input
                        type="number"
                        value={editPoints}
                        onChange={(e) => setEditPoints(e.target.value)}
                        className="w-24 bg-surface-2 border border-accent rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none text-center"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(user.user_id); if (e.key === "Escape") cancelEdit(); }}
                      />
                      <button onClick={() => confirmEdit(user.user_id)} className="text-win hover:opacity-80 transition"><Check size={16} /></button>
                      <button onClick={cancelEdit} className="text-loss hover:opacity-80 transition"><X size={16} /></button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(user)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-3 rounded-lg transition group"
                    >
                      <span className="text-accent font-bold text-sm">{formatPoints(user.points)}</span>
                      <Edit2 size={12} className="text-text-muted group-hover:text-accent transition" />
                    </button>
                  )}
                </div>

                {/* Admin toggle */}
                <button
                  onClick={() => updateUser(user.user_id, { is_admin: !user.is_admin })}
                  disabled={isLoading}
                  title={user.is_admin ? "Quitar admin" : "Hacer admin"}
                  className={`p-2 rounded-lg transition flex-shrink-0 ${user.is_admin ? "text-accent hover:bg-accent/10" : "text-text-muted hover:bg-surface-3"}`}
                >
                  {user.is_admin ? <Shield size={16} /> : <ShieldOff size={16} />}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
