"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Introduce tu email"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error("Error al enviar el email"); return; }
    setSent(true);
  };

  return (
    <div className="relative bg-surface border border-border rounded-3xl shadow-card p-8 animate-slide-up">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-accent-muted border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔑</span>
        </div>
        <h1 className="font-display font-black text-3xl text-text-primary mb-1">RECUPERAR CUENTA</h1>
        <p className="text-text-secondary text-sm">Te enviaremos un link para restablecer tu contraseña</p>
      </div>

      {sent ? (
        <div className="text-center space-y-4">
          <CheckCircle size={48} className="text-win mx-auto" />
          <p className="text-text-primary font-semibold">Email enviado</p>
          <p className="text-text-muted text-sm">Revisa tu bandeja de entrada y sigue el link para restablecer tu contraseña.</p>
          <Link href="/auth/login">
            <Button variant="secondary" fullWidth>Volver al inicio de sesión</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            leftIcon={<Mail size={16} />}
          />
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Enviar link de recuperación
          </Button>
        </form>
      )}

      <Link href="/auth/login" className="flex items-center justify-center gap-1.5 text-text-muted hover:text-text-secondary text-sm mt-6 transition">
        <ArrowLeft size={14} /> Volver al inicio de sesión
      </Link>
    </div>
  );
}
