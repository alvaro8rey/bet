"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { formatDateShort } from "@/utils";
import { Mail, Phone, MapPin, FileText, CheckCircle, Clock, AlertCircle, ChevronDown, Key } from "lucide-react";
import toast from "react-hot-toast";

interface RedemptionCardProps {
  redemption: any;
  onStatusChange?: () => void;
}

export function RedemptionCard({ redemption, onStatusChange }: RedemptionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [digitalKey, setDigitalKey] = useState("");
  const supabase = createClient();

  const isDigital = redemption.reward?.categoria === "digital";

  const statusConfig = {
    pending: { label: "Pendiente", icon: Clock, bg: "bg-pending/10", text: "text-pending" },
    processing: { label: "En proceso", icon: AlertCircle, bg: "bg-blue/10", text: "text-blue" },
    completed: { label: "Completado", icon: CheckCircle, bg: "bg-accent/10", text: "text-accent" },
    cancelled: { label: "Cancelado", icon: AlertCircle, bg: "bg-loss/10", text: "text-loss" },
  };

  const config = statusConfig[redemption.status as keyof typeof statusConfig];
  const Icon = config.icon;

  const updateStatus = async (newStatus: string, key?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("redemptions")
        .update({ status: newStatus })
        .eq("id", redemption.id);

      if (error) throw error;

      try {
        const { error: emailError } = await supabase.functions.invoke("send-redemption-email", {
          body: {
            email: redemption.email,
            nombre: redemption.nombre,
            reward_nombre: redemption.reward?.nombre,
            status: newStatus,
            puntos: redemption.reward?.puntos_necesarios,
            ...(key ? { codigo_digital: key } : {}),
          },
        });
        if (emailError) {
          console.error("Error sending email:", emailError);
          toast.error("Estado actualizado pero el email no se pudo enviar");
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        toast.error("Estado actualizado pero el email no se pudo enviar");
      }

      toast.success(`Estado actualizado a "${statusConfig[newStatus as keyof typeof statusConfig].label}"`);
      setIsOpen(false);
      setShowKeyInput(false);
      setDigitalKey("");
      onStatusChange?.();
    } catch (error) {
      toast.error("Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusClick = (status: string) => {
    if (status === "completed" && isDigital) {
      setIsOpen(false);
      setShowKeyInput(true);
    } else {
      updateStatus(status);
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
            <p className="text-accent font-bold text-sm">
              {redemption.reward?.nombre}
              {isDigital && (
                <span className="ml-2 text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-md font-medium">Digital</span>
              )}
            </p>
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
                    onClick={() => handleStatusClick(status)}
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

        {/* Digital key input — shown when completing a digital reward */}
        {showKeyInput && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-accent text-sm font-semibold">
              <Key size={15} />
              Introduce la clave o código digital
            </div>
            <p className="text-text-muted text-xs">Se incluirá en el email enviado al usuario junto con la confirmación del canje.</p>
            <input
              type="text"
              value={digitalKey}
              onChange={(e) => setDigitalKey(e.target.value)}
              placeholder="Ej: XXXXX-XXXXX-XXXXX"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 font-mono"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateStatus("completed", digitalKey)}
                disabled={loading || !digitalKey.trim()}
                className="flex-1 bg-accent text-background font-semibold text-sm py-2 rounded-lg hover:bg-accent/90 disabled:opacity-40 transition"
              >
                {loading ? "Enviando..." : "Confirmar y enviar email"}
              </button>
              <button
                onClick={() => { setShowKeyInput(false); setDigitalKey(""); }}
                disabled={loading}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

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

          {redemption.direccion && (
            <div className="flex items-start gap-2 text-text-secondary sm:col-span-2">
              <MapPin size={16} className="flex-shrink-0 text-text-muted mt-0.5" />
              <span>{redemption.direccion}</span>
            </div>
          )}
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
