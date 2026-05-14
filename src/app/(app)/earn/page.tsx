import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { formatPoints, formatDate } from "@/utils";
import { Zap, CheckCircle, XCircle } from "lucide-react";
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

  const adminSupabase = await createAdminClient();

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from("profiles").select("points, username").eq("user_id", user.id).single(),
    adminSupabase
      .from("offerwall_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const appId = process.env.NEXT_PUBLIC_CPX_APP_ID;
  const secureHash = buildSecureHash(user.id);

  const totalEarned = transactions
    ?.filter((t) => !t.reversed)
    .reduce((acc, t) => acc + t.reward_points, 0) ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-black text-3xl text-text-primary mb-1">Ganar Puntos</h1>
        <p className="text-text-muted text-sm">Completa encuestas y gana puntos para canjear por premios</p>
      </div>

      {/* Balance actual */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-muted rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-text-muted text-xs">Balance actual</p>
            <p className="text-accent font-bold text-xl">{formatPoints(profile?.points || 0)} pts</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-win/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={18} className="text-win" />
          </div>
          <div>
            <p className="text-text-muted text-xs">Ganado con encuestas</p>
            <p className="text-win font-bold text-xl">+{formatPoints(totalEarned)} pts</p>
          </div>
        </Card>
      </div>

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

      {/* Historial */}
      {transactions && transactions.length > 0 && (
        <Card className="p-5">
          <h2 className="font-display font-bold text-lg text-text-primary mb-4">Historial de encuestas</h2>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  {tx.reversed ? (
                    <XCircle size={16} className="text-loss flex-shrink-0" />
                  ) : (
                    <CheckCircle size={16} className="text-win flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-text-primary text-sm font-medium">
                      {tx.reversed ? "Encuesta revertida" : "Encuesta completada"}
                    </p>
                    <p className="text-text-muted text-xs">{formatDate(tx.created_at)}</p>
                  </div>
                </div>
                <p className={`font-bold text-sm ${tx.reversed ? "text-loss" : "text-win"}`}>
                  {tx.reversed ? "-" : "+"}{formatPoints(tx.reward_points)} pts
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
