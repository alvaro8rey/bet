"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { Mail, Lock, User } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !username || !password) {
      toast.error("Rellena todos los campos");
      return;
    }
    if (username.length < 3) {
      toast.error("El nombre de usuario debe tener al menos 3 caracteres");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    // Check username availability
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.trim())
      .maybeSingle();

    if (existing) {
      toast.error("Ese nombre de usuario ya está en uso");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        username: username.trim(),
        points: 1000,
        total_bets: 0,
        won_bets: 0,
        lost_bets: 0,
        is_admin: false,
      });

      if (profileError) {
        toast.error("Error al crear el perfil. Por favor intenta de nuevo.");
        console.error("Profile creation error:", profileError);
        setLoading(false);
        return;
      }

      toast.success("¡Cuenta creada! Recibes 1.000 puntos de bienvenida 🎉");

      // Wait a moment for session to sync
      await new Promise(resolve => setTimeout(resolve, 500));

      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="relative bg-surface border border-border rounded-3xl shadow-card p-8 animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-accent-muted border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚀</span>
        </div>
        <h1 className="font-display font-black text-3xl text-text-primary mb-1">ÚNETE GRATIS</h1>
        <p className="text-text-secondary text-sm">Empieza con 1.000 puntos de bienvenida</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label="Nombre de usuario"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="predator99"
          leftIcon={<User size={16} />}
        />
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
          placeholder="Mín. 6 caracteres"
          autoComplete="new-password"
          leftIcon={<Lock size={16} />}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          leftIcon={<Lock size={16} />}
        />

        <Button type="submit" fullWidth size="lg" loading={loading} className="mt-6">
          Crear cuenta gratuita
        </Button>
      </form>

      <p className="text-center text-text-muted text-sm mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link href="/auth/login" className="text-accent hover:text-accent-dim font-semibold transition-colors">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
