"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Sesión cerrada 👋");
      router.push("/auth/login");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al cerrar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      loading={loading}
      variant="secondary"
      size="sm"
      className="gap-2"
    >
      <LogOut size={16} />
      Cerrar sesión
    </Button>
  );
}
