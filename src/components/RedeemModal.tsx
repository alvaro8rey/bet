"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";
import toast from "react-hot-toast";

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: {
    id: number;
    nombre: string;
    puntos_necesarios: number;
    valor_euros: number;
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

      // Validate form
      if (!formData.nombre || !formData.email || !formData.direccion) {
        toast.error("Por favor completa todos los campos requeridos");
        setLoading(false);
        return;
      }

      // Create redemption record
      const { error: redemptionError } = await supabase
        .from("redemptions")
        .insert({
          user_id: user.id,
          reward_id: reward.id,
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion,
          notas: formData.notas,
          status: "pending",
        });

      if (redemptionError) throw redemptionError;

      // Deduct points from user
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        const newPoints = Math.max(0, profile.points - reward.puntos_necesarios);
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ points: newPoints })
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      }

      toast.success(`¡Canje realizado! Nos pondremos en contacto pronto en ${formData.email}`);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface">
          <h2 className="font-semibold text-lg text-text-primary">Canjear: {reward.nombre}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Nombre completo *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Juan García"
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ej: juan@ejemplo.com"
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej: +34 600 123 456"
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Dirección de envío *</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Ej: Calle Principal 123, 28001 Madrid"
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Notas adicionales</label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              placeholder="Ej: Preferencia de color, etc."
              rows={3}
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition resize-none"
            />
          </div>

          <div className="bg-blue-muted/30 border border-blue/20 rounded-lg p-4 text-sm text-text-primary">
            <p className="font-medium mb-1">Se deducirán {reward.puntos_necesarios.toLocaleString()} puntos</p>
            <p className="text-text-muted text-xs">Te contactaremos en el email proporcionado para confirmar el envío del premio.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-primary hover:bg-surface-2 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-dim text-background font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Procesando..." : "Confirmar canje"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
