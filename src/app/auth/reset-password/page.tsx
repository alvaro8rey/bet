"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Supabase sets the session automatically when the recovery link is clicked
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirm) { toast.error("Las contraseñas no coinciden"); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) { toast.error("Error al actualizar la contraseña"); return; }
    toast.success("Contraseña actualizada correctamente");
    router.push("/dashboard");
  };

  if (!ready) {
    return (
      <div className="relative bg-surface border border-border rounded-3xl shadow-card p-8 text-center animate-slide-up">
        <div className="w-14 h-14 bg-accent-muted border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔑</span>
        </div>
        <h1 className="font-display font-black text-2xl text-text-primary mb-2">Verificando enlace…</h1>
        <p className="text-text-muted text-sm">Espera un momento mientras validamos tu link de recuperación.</p>
      </div>
    );
  }

  return (
    <div className="relative bg-surface border border-border rounded-3xl shadow-card p-8 animate-slide-up">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-accent-muted border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔐</span>
        </div>
        <h1 className="font-display font-black text-3xl text-text-primary mb-1">NUEVA CONTRASEÑA</h1>
        <p className="text-text-secondary text-sm">Elige una contraseña segura para tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nueva contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          leftIcon={<Lock size={16} />}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          leftIcon={<Lock size={16} />}
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Guardar nueva contraseña
        </Button>
      </form>
    </div>
  );
}
