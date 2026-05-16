"use client";

import { useState } from "react";
import { Copy, Check, Users, Gift } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface ReferralCardProps {
  referralCode: string;
  referralCount: number;
}

export function ReferralCard({ referralCode, referralCount }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : "https://www.sharpbet.es"}/auth/register?ref=${referralCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Gift size={18} className="text-accent" />
        <h2 className="font-display font-bold text-lg text-text-primary">Invita amigos</h2>
      </div>

      <p className="text-text-secondary text-sm mb-4">
        Comparte tu enlace y cuando un amigo se registre, <span className="text-accent font-semibold">ambos recibís 500 puntos</span>.
      </p>

      {/* Code */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-2.5">
          <p className="text-xs text-text-muted mb-0.5">Tu código</p>
          <p className="text-accent font-bold font-mono tracking-widest">{referralCode}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-3 bg-accent hover:bg-accent/80 text-background rounded-xl font-medium text-sm transition flex-shrink-0"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "¡Copiado!" : "Copiar enlace"}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 bg-surface-2 rounded-xl px-4 py-3">
        <Users size={16} className="text-text-muted flex-shrink-0" />
        <span className="text-text-secondary text-sm">
          Has invitado a <span className="text-text-primary font-semibold">{referralCount}</span> {referralCount === 1 ? "persona" : "personas"}
          {referralCount > 0 && <span className="text-accent"> · +{referralCount * 500} pts ganados</span>}
        </span>
      </div>
    </Card>
  );
}
