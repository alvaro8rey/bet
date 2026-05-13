"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Rellena todos los campos");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Credenciales incorrectas" : error.message);
      setLoading(false);
      return;
    }

    toast.success("¡Bienvenido de vuelta!");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="relative bg-surface border border-border rounded-3xl shadow-card p-8 animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-accent-muted border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎯</span>
        </div>
        <h1 className="font-display font-black text-3xl text-text-primary mb-1">BIENVENIDO</h1>
        <p className="text-text-secondary text-sm">Entra a tu cuenta de PlayfulBet</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          leftIcon={<Mail size={16} />}
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          leftIcon={<Lock size={16} />}
        />

        <Button type="submit" fullWidth size="lg" loading={loading} className="mt-6">
          Iniciar sesión
        </Button>
      </form>

      <p className="text-center text-text-muted text-sm mt-6">
        ¿No tienes cuenta?{" "}
        <Link href="/auth/register" className="text-accent hover:text-accent-dim font-semibold transition-colors">
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}
