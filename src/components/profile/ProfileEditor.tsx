"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Camera, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPoints, formatDate } from "@/utils";
import { LogoutButton } from "@/components/profile/LogoutButton";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Profile } from "@/types";

interface ProfileEditorProps {
  profile: Profile;
  email: string;
}

export function ProfileEditor({ profile, email }: ProfileEditorProps) {
  const [editing, setEditing]           = useState(false);
  const [username, setUsername]         = useState(profile.username);
  const [avatarFile, setAvatarFile]     = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const fileInputRef                    = useRef<HTMLInputElement>(null);
  const supabase                        = createClient();
  const router                          = useRouter();

  const currentAvatar = avatarPreview ?? profile.avatar_url;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("La imagen no puede superar 2 MB"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const trimmed = username.trim();
    if (!trimmed) { toast.error("El nombre no puede estar vacío"); return; }
    setSaving(true);
    try {
      let avatarUrl = profile.avatar_url;

      if (avatarFile) {
        const ext  = avatarFile.name.split(".").pop() ?? "jpg";
        const path = `${profile.user_id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ username: trimmed, avatar_url: avatarUrl })
        .eq("user_id", profile.user_id);
      if (error) throw error;

      toast.success("Perfil actualizado");
      setEditing(false);
      setAvatarFile(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setUsername(profile.username);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  return (
    <div className="flex items-center gap-5">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className={`w-20 h-20 rounded-2xl overflow-hidden shadow-accent ${editing ? "cursor-pointer ring-2 ring-accent/40" : ""}`}
          onClick={() => editing && fileInputRef.current?.click()}
        >
          {currentAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentAvatar} alt={username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent to-blue flex items-center justify-center">
              <span className="text-background font-display font-black text-3xl">
                {username?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        {editing && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 transition"
          >
            <Camera size={13} className="text-background" />
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            autoFocus
            className="w-full bg-surface-2 border border-accent/40 rounded-xl px-3 py-1.5 text-text-primary font-bold text-xl focus:outline-none focus:border-accent mb-1"
          />
        ) : (
          <h1 className="font-display font-black text-3xl text-text-primary">{profile.username}</h1>
        )}
        <p className="text-text-muted text-sm">{email}</p>
        <p className="text-text-muted text-xs mt-0.5">Miembro desde {formatDate(profile.created_at)}</p>
        {profile.is_admin && (
          <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-muted border border-blue/20 text-blue text-xs rounded-lg font-medium">
            👑 Admin
          </span>
        )}
      </div>

      {/* Actions (desktop) */}
      <div className="ml-auto hidden sm:flex flex-col items-end gap-3">
        {editing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleCancel} disabled={saving}>
              <X size={14} /> Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              <Check size={14} /> Guardar
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-text-muted hover:text-text-primary text-xs transition px-2 py-1 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border"
            >
              <Pencil size={12} /> Editar perfil
            </button>
            <LogoutButton />
          </div>
        )}
        <Link href="/earn" className="text-right group">
          <p className="text-accent font-bold text-3xl group-hover:text-accent/80 transition-colors">{formatPoints(profile.points)}</p>
          <p className="text-text-muted text-sm group-hover:text-accent/60 transition-colors">puntos actuales ↗</p>
        </Link>
      </div>

      {/* Mobile edit button */}
      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="sm:hidden absolute top-4 right-4 text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border transition"
        >
          <Pencil size={14} />
        </button>
      )}
    </div>
  );
}
