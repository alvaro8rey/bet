"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatPoints, formatDate } from "@/utils";
import { Shield, ShieldOff, Edit2, Check, X, Trash2, KeyRound, Pencil } from "lucide-react";
import toast from "react-hot-toast";

interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  points: number;
  total_bets: number;
  won_bets: number;
  lost_bets: number;
  referral_count: number;
  is_admin: boolean;
  created_at: string;
  avatar_url: string | null;
}

type EditMode = "points" | "username" | null;
type ConfirmMode = "delete" | null;

export function UsersTable({ initialUsers }: { initialUsers: UserProfile[] }) {
  const [users, setUsers]       = useState(initialUsers);
  const [search, setSearch]     = useState("");
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editMode, setEditMode]     = useState<EditMode>(null);
  const [editPoints, setEditPoints] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [confirmId, setConfirmId]   = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [loading, setLoading]   = useState<string | null>(null);

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const patchUser = async (userId: string, updates: Record<string, unknown>) => {
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

  const deleteUser = async (userId: string) => {
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      toast.success("Usuario eliminado");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setLoading(null);
      setConfirmId(null);
    }
  };

  const sendReset = async (userId: string) => {
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Email de recuperación enviado");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setLoading(null);
    }
  };

  const startEdit = (user: UserProfile, mode: EditMode) => {
    setEditingId(user.user_id);
    setEditMode(mode);
    if (mode === "points")   setEditPoints(String(user.points));
    if (mode === "username") setEditUsername(user.username);
  };

  const confirmEdit = (userId: string) => {
    if (editMode === "points") {
      const pts = parseInt(editPoints);
      if (isNaN(pts) || pts < 0) { toast.error("Puntos inválidos"); return; }
      patchUser(userId, { points: pts });
    }
    if (editMode === "username") {
      if (!editUsername.trim()) { toast.error("Nombre vacío"); return; }
      patchUser(userId, { username: editUsername.trim() });
    }
    setEditingId(null);
    setEditMode(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditMode(null); };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Buscar por usuario o email..."
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
          const winRate  = user.total_bets > 0 ? Math.round((user.won_bets / user.total_bets) * 100) : 0;
          const isEditing = editingId === user.user_id;
          const isLoading = loading === user.user_id;
          const isConfirming = confirmId === user.user_id;

          return (
            <Card key={user.user_id} className={`p-4 transition ${isLoading ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0 overflow-hidden mt-0.5">
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-sm font-bold text-text-muted uppercase">{user.username[0]}</span>
                  }
                </div>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  {isEditing && editMode === "username" ? (
                    <div className="flex items-center gap-1.5 mb-1">
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="flex-1 bg-surface-2 border border-accent rounded-lg px-2 py-0.5 text-sm text-text-primary focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(user.user_id); if (e.key === "Escape") cancelEdit(); }}
                      />
                      <button onClick={() => confirmEdit(user.user_id)} className="text-win"><Check size={14} /></button>
                      <button onClick={cancelEdit} className="text-loss"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-text-primary font-semibold text-sm truncate">{user.username}</p>
                      {user.is_admin && <span className="text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded font-medium flex-shrink-0">ADMIN</span>}
                      <button onClick={() => startEdit(user, "username")} className="text-text-muted hover:text-accent transition flex-shrink-0">
                        <Pencil size={11} />
                      </button>
                    </div>
                  )}
                  <p className="text-text-muted text-xs truncate">{user.email}</p>
                  <p className="text-text-muted text-[11px] mt-0.5">{formatDate(user.created_at)}</p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-5 text-center flex-shrink-0">
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
                </div>

                {/* Points editable */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isEditing && editMode === "points" ? (
                    <>
                      <input
                        type="number"
                        value={editPoints}
                        onChange={(e) => setEditPoints(e.target.value)}
                        className="w-22 bg-surface-2 border border-accent rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none text-center"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(user.user_id); if (e.key === "Escape") cancelEdit(); }}
                      />
                      <button onClick={() => confirmEdit(user.user_id)} className="text-win"><Check size={15} /></button>
                      <button onClick={cancelEdit} className="text-loss"><X size={15} /></button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(user, "points")}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-2 hover:bg-surface-3 rounded-lg transition group"
                    >
                      <span className="text-accent font-bold text-sm">{formatPoints(user.points)}</span>
                      <Edit2 size={11} className="text-text-muted group-hover:text-accent transition" />
                    </button>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Admin toggle */}
                  <button
                    onClick={() => patchUser(user.user_id, { is_admin: !user.is_admin })}
                    disabled={isLoading}
                    title={user.is_admin ? "Quitar admin" : "Hacer admin"}
                    className={`p-1.5 rounded-lg transition ${user.is_admin ? "text-accent hover:bg-accent/10" : "text-text-muted hover:bg-surface-3"}`}
                  >
                    {user.is_admin ? <Shield size={15} /> : <ShieldOff size={15} />}
                  </button>

                  {/* Send reset */}
                  <button
                    onClick={() => sendReset(user.user_id)}
                    disabled={isLoading}
                    title="Enviar recuperación de contraseña"
                    className="p-1.5 rounded-lg text-text-muted hover:text-blue hover:bg-blue/10 transition"
                  >
                    <KeyRound size={15} />
                  </button>

                  {/* Delete */}
                  {isConfirming && confirmMode === "delete" ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteUser(user.user_id)} className="text-[11px] px-2 py-1 bg-loss text-white rounded-lg font-medium">Eliminar</button>
                      <button onClick={() => setConfirmId(null)} className="text-[11px] px-2 py-1 bg-surface-2 text-text-muted rounded-lg">No</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmId(user.user_id); setConfirmMode("delete"); }}
                      disabled={isLoading}
                      title="Eliminar usuario"
                      className="p-1.5 rounded-lg text-text-muted hover:text-loss hover:bg-loss/10 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
