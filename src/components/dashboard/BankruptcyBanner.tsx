"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface BankruptcyBannerProps {
  bankruptcyAt: string;
}

function getTimeUntilReset(bankruptcyAt: string): string {
  const bankruptDate = new Date(bankruptcyAt);
  const resetDate = new Date(bankruptDate.getFullYear(), bankruptDate.getMonth(), bankruptDate.getDate() + 1);
  const now = new Date();
  const diff = resetDate.getTime() - now.getTime();

  if (diff <= 0) return "pronto";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function BankruptcyBanner({ bankruptcyAt }: BankruptcyBannerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilReset(bankruptcyAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilReset(bankruptcyAt));
    }, 60_000);
    return () => clearInterval(interval);
  }, [bankruptcyAt]);

  return (
    <div className="bg-loss/10 border border-loss/30 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle size={18} className="text-loss flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-loss font-semibold text-sm">¡Te has quedado sin puntos!</p>
        <p className="text-text-muted text-xs mt-0.5">
          Mañana recibirás <span className="text-text-primary font-medium">1.000 puntos</span> para volver a competir.
        </p>
        <p className="text-text-muted text-xs mt-1">
          Tiempo restante: <span className="text-text-primary font-medium">{timeLeft}</span>
        </p>
      </div>
    </div>
  );
}
