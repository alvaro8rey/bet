"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { formatDateShort } from "@/utils";
import { Mail, Phone, MapPin, FileText, CheckCircle, Clock, AlertCircle, Key, XCircle, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

interface RedemptionCardProps {
  redemption: any;
  onStatusChange?: () => void;
}

export function RedemptionCard({ redemption, onStatusChange }: RedemptionCardProps) {
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [digitalKey, setDigitalKey] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const supabase = createClient();

  const isDigital = redemption.reward?.categoria === "digital";

  const statusConfig = {
    pending:    { label: "Pendiente",   icon: Clock,         bg: "bg-pending/10", text: "text-pending" },
    processing: { label: "En proceso",  icon: AlertCircle,   bg: "bg-blue/10",    text: "text-blue" },
    completed:  { label: "Completado",  icon: CheckCircle,   bg: "bg-accent/10",  text: "text-accent" },
    cancelled:  { label: "Cancelado",   icon: XCircle,       bg: "bg-loss/10",    text: "text-loss" },
  };

  const config = statusConfig[redemption.status as keyof typeof statusConfig];
  const Icon = config.icon;
  const isFinal = redemption.status === "completed" || redemption.status === "cancelled";

  const updateStatus = async (newStatus: string, key?: string, reason?: string) => {
    setLoading(true);
    try {
      if (newStatus === "cancelled") {
        const res = await fetch("/api/admin/cancel-redemption", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ redemptionId: redemption.id, reason }),
        });
        if (!res.ok) throw new Error("Failed to cancel");
      } else {
        const { error } = await supabase
          .from("redemptions")
          .update({ status: newStatus })
          .eq("id", redemption.id);
        if (error) throw error;
      }

      try {
        const { error: emailError } = await supabase.functions.invoke("send-redemption-email", {
          body: {
            email: redemption.email,
            nombre: redemption.nombre,
            reward_nombre: redemption.reward?.nombre,
            status: newStatus,
            puntos: redemption.reward?.puntos_necesarios,
            ...(key ? { codigo_digital: key } : {}),
            ...(reason ? { motivo_cancelacion: reason } : {}),
          },
        });
        if (emailError) toast.error("Estado actualizado pero el email no se pudo enviar");
      } catch {
        toast.error("Estado actualizado pero el email no se pudo enviar");
      }

      toast.success(`Estado actualizado a "${statusConfig[newStatus as keyof typeof statusConfig].label}"`);
      setShowActions(false);
      setShowKeyInput(false);
      setShowCancelInput(false);
      setDigitalKey("");
      setCancelReason("");
      onStatusChange?.();
    } catch {
      toast.error("Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (status: string) => {
    setShowActions(false);
    if (status === "completed" && isDigital) {
      setShowKeyInput(true);
    } else if (status === "cancelled") {
      setShowCancelInput(true);
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

          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${config.bg} ${config.text}`}>
            <Icon size={13} />
            {config.label}
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <Mail size={15} className="flex-shrink-0 text-text-muted" />
            <span className="truncate">{redemption.email}</span>
          </div>
          {redemption.telefono && (
            <div className="flex items-center gap-2 text-text-secondary">
              <Phone size={15} className="flex-shrink-0 text-text-muted" />
              <span>{redemption.telefono}</span>
            </div>
          )}
          {redemption.direccion && (
            <div className="flex items-start gap-2 text-text-secondary sm:col-span-2">
              <MapPin size={15} className="flex-shrink-0 text-text-muted mt-0.5" />
              <span>{redemption.direccion}</span>
            </div>
          )}
        </div>

        {redemption.notas && (
          <div className="flex items-start gap-2 bg-surface-2 rounded-lg p-3 text-sm">
            <FileText size={15} className="flex-shrink-0 text-text-muted mt-0.5" />
            <span className="text-text-secondary">{redemption.notas}</span>
          </div>
        )}

        {/* Digital key input */}
        {showKeyInput && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-accent text-sm font-semibold">
              <Key size={15} />
              Introduce el código digital
            </div>
            <p className="text-text-muted text-xs">Se enviará en el email de confirmación al usuario.</p>
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
              <button onClick={() => { setShowKeyInput(false); setDigitalKey(""); }} disabled={loading}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Cancel reason input */}
        {showCancelInput && (
          <div className="bg-loss/5 border border-loss/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-loss text-sm font-semibold">
              <XCircle size={15} />
              Cancelar premio
            </div>
            <p className="text-text-muted text-xs">Motivo de cancelación (opcional) — si lo rellenas se incluirá en el email al usuario. Los puntos se devolverán automáticamente.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ej: Premio agotado, datos de envío incorrectos..."
              rows={2}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-loss/60 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateStatus("cancelled", undefined, cancelReason || undefined)}
                disabled={loading}
                className="flex-1 bg-loss text-white font-semibold text-sm py-2 rounded-lg hover:bg-loss/90 disabled:opacity-40 transition"
              >
                {loading ? "Cancelando..." : "Confirmar cancelación"}
              </button>
              <button onClick={() => { setShowCancelInput(false); setCancelReason(""); }} disabled={loading}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition">
                Volver
              </button>
            </div>
          </div>
        )}

        {/* Footer: date + actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-text-muted">
          <span>{formatDateShort(redemption.created_at)} · {redemption.reward?.puntos_necesarios.toLocaleString()} pts</span>

          {!isFinal && !showKeyInput && !showCancelInput && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-text-secondary hover:text-text-primary text-xs font-medium transition"
              >
                Cambiar estado <ChevronDown size={11} className={showActions ? "rotate-180 transition" : "transition"} />
              </button>

              {showActions && (
                <div className="absolute bottom-full right-0 mb-1 w-44 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  {Object.entries(statusConfig)
                    .filter(([s]) => s !== redemption.status)
                    .map(([status, cfg]) => {
                      const Ic = cfg.icon;
                      return (
                        <button
                          key={status}
                          onClick={() => handleActionClick(status)}
                          disabled={loading}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-left hover:bg-surface-2 transition ${cfg.text}`}
                        >
                          <Ic size={14} />
                          {cfg.label}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
