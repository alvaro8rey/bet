import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { formatPoints } from "@/utils";
import { Zap } from "lucide-react";
import { EarnOfferwall } from "@/components/earn/EarnOfferwall";
import crypto from "crypto";

function buildSecureHash(userId: string): string {
  const key = process.env.CPX_SECURITY_HASH ?? "";
  return crypto.createHash("md5").update(userId + "-" + key).digest("hex");
}

export default async function EarnPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("points, username")
    .eq("user_id", user.id)
    .single();

  const appId = process.env.NEXT_PUBLIC_CPX_APP_ID;
  const secureHash = buildSecureHash(user.id);

  return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display font-black text-3xl text-text-primary mb-1">Ganar Puntos</h1>
          <p className="text-text-muted text-sm">Completa encuestas y gana puntos para canjear por premios</p>
        </div>

        {/* Balance actual */}
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-muted rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-text-muted text-xs">Tu balance actual</p>
            <p className="text-accent font-bold text-xl">{formatPoints(profile?.points || 0)} pts</p>
          </div>
          <p className="ml-auto text-text-muted text-xs max-w-xs text-right hidden sm:block">
            Los puntos se acreditan automáticamente al completar cada encuesta
          </p>
        </Card>

        {/* Offerwall */}
        {appId ? (
          <EarnOfferwall appId={appId} userId={user.id} secureHash={secureHash} />
        ) : (
          <Card className="p-10 text-center">
            <Zap size={40} className="text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-text-primary font-semibold mb-1">Encuestas no configuradas</p>
            <p className="text-text-muted text-sm">
              Añade <code className="bg-surface-2 px-1.5 py-0.5 rounded text-accent">NEXT_PUBLIC_CPX_APP_ID</code> y{" "}
              <code className="bg-surface-2 px-1.5 py-0.5 rounded text-accent">CPX_SECURITY_HASH</code> a las variables de entorno.
            </p>
          </Card>
        )}
      </div>
  );
}

export const dynamic = "force-dynamic";
