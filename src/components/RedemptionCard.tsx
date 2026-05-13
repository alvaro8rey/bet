"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { formatDateShort } from "@/utils";
import { Mail, Phone, MapPin, FileText, CheckCircle, Clock, AlertCircle, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

interface RedemptionCardProps {
  redemption: any;
  onStatusChange?: () => void;
}

export function RedemptionCard({ redemption, onStatusChange }: RedemptionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const statusConfig = {
    pending: { label: "Pendiente", icon: Clock, bg: "bg-pending/10", text: "text-pending" },
    processing: { label: "En proceso", icon: AlertCircle, bg: "bg-blue/10", text: "text-blue" },
    completed: { label: "Completado", icon: CheckCircle, bg: "bg-accent/10", text: "text-accent" },
    cancelled: { label: "Cancelado", icon: AlertCircle, bg: "bg-loss/10", text: "text-loss" },
  };

  const config = statusConfig[redemption.status as keyof typeof statusConfig];
  const Icon = config.icon;

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("redemptions")
        .update({ status: newStatus })
        .eq("id", redemption.id);

      if (error) throw error;

      // Enviar email automático
      try {
        await supabase.functions.invoke("send-redemption-email", {
          body: {
            email: redemption.email,
            nombre: redemption.nombre,
            reward_nombre: redemption.reward?.nombre,
            status: newStatus,
            puntos: redemption.reward?.puntos_necesarios,
          },
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }

      toast.success(`Estado actualizado a "${statusConfig[newStatus as keyof typeof statusConfig].label}"`);
      setIsOpen(false);
      onStatusChange?.();
    } catch (error) {
      toast.error("Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <p className="font-semibold text-text-primary">{redemption.nombre}</p>
              <p className="text-text-muted text-xs font-medium">@{redemption.profile?.username}</p>
            </div>
            <p className="text-accent font-bold text-sm">{redemption.reward?.nombre}</p>
          </div>

          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${config.bg} ${config.text}`}
            >
              <Icon size={14} />
              {config.label}
              <ChevronDown size={12} className={`transition ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-surface border border-border rounded-lg shadow-lg z-10">
                {Object.entries(statusConfig).map(([status, cfg]) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={loading || status === redemption.status}
                    className={`w-full px-4 py-2.5 text-sm font-medium text-left transition ${
                      status === redemption.status
                        ? `${cfg.bg} ${cfg.text} cursor-default`
                        : "text-text-secondary hover:bg-surface-2"
                    } disabled:opacity-50 first:rounded-t-lg last:rounded-b-lg`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <Mail size={16} className="flex-shrink-0 text-text-muted" />
            <span>{redemption.email}</span>
          </div>

          {redemption.telefono && (
            <div className="flex items-center gap-2 text-text-secondary">
              <Phone size={16} className="flex-shrink-0 text-text-muted" />
              <span>{redemption.telefono}</span>
            </div>
          )}

          <div className="flex items-start gap-2 text-text-secondary sm:col-span-2">
            <MapPin size={16} className="flex-shrink-0 text-text-muted mt-0.5" />
            <span>{redemption.direccion}</span>
          </div>
        </div>

        {/* Notes */}
        {redemption.notas && (
          <div className="flex items-start gap-2 bg-surface-2 rounded-lg p-3 text-sm">
            <FileText size={16} className="flex-shrink-0 text-text-muted mt-0.5" />
            <span className="text-text-secondary">{redemption.notas}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-text-muted">
          <span>{formatDateShort(redemption.created_at)}</span>
          <span>{redemption.reward?.puntos_necesarios.toLocaleString()} puntos</span>
        </div>
      </div>
    </Card>
  );
}
