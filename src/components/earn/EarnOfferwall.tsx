"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Offerwall {
  id: string;
  label: string;
  url: string;
  mobileOnly?: boolean;
}

interface EarnOfferwallProps {
  cpxAppId?: string;
  cpxUserId?: string;
  cpxSecureHash?: string;
  theoremReachApiKey?: string;
  theoremReachUserId?: string;
  bitlabsAppToken?: string;
  bitlabsUserId?: string;
  adgemAppId?: string;
  adgemUserId?: string;
}

export function EarnOfferwall({
  cpxAppId,
  cpxUserId,
  cpxSecureHash,
  theoremReachApiKey,
  theoremReachUserId,
  bitlabsAppToken,
  bitlabsUserId,
  adgemAppId,
  adgemUserId,
}: EarnOfferwallProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  const walls: Offerwall[] = [];

  if (cpxAppId && cpxUserId && cpxSecureHash) {
    walls.push({
      id: "cpx",
      label: "CPX Research",
      url: `https://offers.cpx-research.com/index.php?app_id=${cpxAppId}&ext_user_id=${cpxUserId}&secure_hash=${cpxSecureHash}`,
    });
  }

  if (theoremReachApiKey && theoremReachUserId) {
    walls.push({
      id: "theoremreach",
      label: "Theorem Reach",
      url: `https://theoremreach.com/respondent_entry/direct?api_key=${theoremReachApiKey}&user_id=${theoremReachUserId}`,
    });
  }

  if (bitlabsAppToken && bitlabsUserId) {
    walls.push({
      id: "bitlabs",
      label: "BitLabs",
      url: `https://web.bitlabs.ai?uid=${bitlabsUserId}&token=${bitlabsAppToken}`,
    });
  }

  if (adgemAppId && adgemUserId) {
    walls.push({
      id: "adgem",
      label: "AdGem",
      url: `https://adunits.adgem.com/wall?appid=${adgemAppId}&playerid=${adgemUserId.replace(/-/g, "")}`,
      mobileOnly: true,
    });
  }

  if (walls.length === 0) return null;

  const current = walls[activeTab];

  return (
    <div className="space-y-2">
      {/* Tabs */}
      {walls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {walls.map((wall, i) => (
            <button
              key={wall.id}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${wall.mobileOnly ? "lg:hidden" : ""} ${
                activeTab === i
                  ? "bg-accent text-background"
                  : "bg-surface-2 text-text-secondary hover:text-text-primary border border-border"
              }`}
            >
              {wall.label}
            </button>
          ))}
        </div>
      )}

      {/* Iframe */}
      <div
        className={`relative w-full rounded-2xl overflow-hidden border border-border bg-surface ${current.mobileOnly ? "lg:hidden" : ""}`}
      >
        {!loaded[activeTab] && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
            <div className="text-center">
              <Loader2 size={32} className="text-accent animate-spin mx-auto mb-3" />
              <p className="text-text-muted text-sm">Cargando encuestas...</p>
            </div>
          </div>
        )}
        <iframe
          key={current.id}
          src={current.url}
          className="w-full border-0 h-[400px] sm:h-[calc(100vh-300px)] sm:min-h-[600px]"
          onLoad={() => setLoaded((prev) => ({ ...prev, [activeTab]: true }))}
          title={current.label}
        />
      </div>
    </div>
  );
}
