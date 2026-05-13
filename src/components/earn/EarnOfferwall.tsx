"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface EarnOfferwallProps {
  appId: string;
  userId: string;
}

export function EarnOfferwall({ appId, userId }: EarnOfferwallProps) {
  const [loaded, setLoaded] = useState(false);

  const url = `https://www.monlix.com/wall/${appId}?sub_id=${userId}`;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-border bg-surface"
      style={{ minHeight: 600 }}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
          <div className="text-center">
            <Loader2 size={32} className="text-accent animate-spin mx-auto mb-3" />
            <p className="text-text-muted text-sm">Cargando ofertas...</p>
          </div>
        </div>
      )}
      <iframe
        src={url}
        className="w-full border-0"
        style={{ height: "calc(100vh - 300px)", minHeight: 600 }}
        onLoad={() => setLoaded(true)}
        allow="clipboard-write"
        title="Ofertas Monlix"
      />
    </div>
  );
}
