"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  url: string;
  description: string;
}

interface EarnOfferwallProps {
  userId: string;
  providers: Provider[];
}

export function EarnOfferwall({ userId, providers }: EarnOfferwallProps) {
  const [activeProvider, setActiveProvider] = useState(providers[0]?.id);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const current = providers.find((p) => p.id === activeProvider);

  if (!current) return null;

  return (
    <div className="space-y-3">
      {/* Tabs si hay más de un proveedor */}
      {providers.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProvider(p.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeProvider === p.id
                  ? "bg-accent text-background"
                  : "bg-surface-2 text-text-secondary hover:text-text-primary border border-border"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <p className="text-text-muted text-xs">{current.description}</p>

      {/* Iframe del proveedor activo */}
      {providers.map((p) => (
        <div
          key={p.id}
          className={`relative w-full rounded-2xl overflow-hidden border border-border bg-surface ${activeProvider === p.id ? "block" : "hidden"}`}
          style={{ minHeight: 600 }}
        >
          {!loaded[p.id] && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
              <div className="text-center">
                <Loader2 size={32} className="text-accent animate-spin mx-auto mb-3" />
                <p className="text-text-muted text-sm">Cargando ofertas de {p.name}...</p>
              </div>
            </div>
          )}
          <iframe
            src={p.url.replace("{userId}", userId)}
            className="w-full border-0"
            style={{ height: "calc(100vh - 300px)", minHeight: 600 }}
            onLoad={() => setLoaded((prev) => ({ ...prev, [p.id]: true }))}
            allow="clipboard-write"
            title={`Ofertas de ${p.name}`}
          />
        </div>
      ))}
    </div>
  );
}
