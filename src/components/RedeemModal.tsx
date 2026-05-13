"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Package, Zap } from "lucide-react";
import toast from "react-hot-toast";

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: {
    id: number;
    nombre: string;
    puntos_necesarios: number;
    valor_euros: number;
    categoria: "digital" | "fisico";
  };
  onSuccess: () => void;
}

export function RedeemModal({ isOpen, onClose, reward, onSuccess }: RedeemModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    notas: "",
  });

  const isDigital = reward.categoria === "digital";
  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes estar logueado para canjear premios");
        return;
      }

      if (!formData.nombre || !formData.email) {
        toast.error("Por favor completa los campos requeridos");
        setLoading(false);
        return;
      }

      if (!isDigital && !formData.direccion) {
        toast.error("La dirección de envío es obligatoria para premios físicos");
        setLoading(false);
        return;
      }

      const { error: redemptionError } = await supabase
        .from("redemptions")
        .insert({
          user_id: user.id,
          reward_id: reward.id,
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono || null,
          direccion: formData.direccion || null,
          notas: formData.notas || null,
          status: "pending",
        });

      if (redemptionError) throw redemptionError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ points: Math.max(0, profile.points - reward.puntos_necesarios) })
          .eq("user_id", user.id);
        if (updateError) throw updateError;
      }

      toast.success(
        isDigital
          ? `¡Canje realizado! Recibirás el código en ${formData.email}`
          : `¡Canje realizado! Te contactaremos en ${formData.email} para el envío`
      );
      onSuccess();
      onClose();
      setFormData({ nombre: "", email: "", telefono: "", direccion: "", notas: "" });
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast.error("Error al procesar el canje. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-surface">
          <div className="flex items-center gap-2">
            {isDigital
              ? <Zap size={18} className="text-accent" />
              : <Package size={18} className="text-pending" />
            }
            <h2 className="font-semibold text-base text-text-primary">{reward.nombre}</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition p-1">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Tipo badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
            isDigital ? "bg-blue/10 text-blue border border-blue/20" : "bg-pending/10 text-pending border border-pending/20"
          }`}>
            {isDigital
              ? "📧 Premio digital — solo necesitamos tu email para enviarte el código"
              : "📦 Premio físico — necesitamos tu dirección de envío"
            }
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Nombre completo *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Juan García"
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="juan@ejemplo.com"
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition"
              required
            />
          </div>

          {/* Campos solo para físicos */}
          {!isDigital && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="+34 600 123 456"
                  className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Dirección de envío *</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Calle Principal 123, 28001 Madrid"
                  className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Notas adicionales</label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  placeholder="Portal, piso, preferencias..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition resize-none"
                />
              </div>
            </>
          )}

          <div className="bg-surface-2 border border-border rounded-lg p-3 text-xs text-text-muted">
            Se deducirán <span className="text-text-primary font-semibold">{reward.puntos_necesarios.toLocaleString()} puntos</span> de tu balance.
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-primary hover:bg-surface-2 transition font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-dim text-background font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Procesando..." : "Confirmar canje"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
