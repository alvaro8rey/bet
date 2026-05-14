import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { formatPoints } from "@/utils";
import { Gift, Lock } from "lucide-react";
import Link from "next/link";

interface Reward {
  id: number;
  puntos_necesarios: number;
  categoria: "digital" | "fisico";
  nombre: string;
  descripcion: string;
  valor_euros: number;
  imagen_url?: string;
}

export default async function PremiosPublicPage() {
  const supabase = await createClient();

  const { data: rewards } = await supabase
    .from("rewards")
    .select("id, nombre, descripcion, puntos_necesarios, categoria, valor_euros, imagen_url")
    .order("puntos_necesarios", { ascending: true });

  const digitalRewards = rewards?.filter((r) => r.categoria === "digital") || [];
  const fisicosRewards = rewards?.filter((r) => r.categoria === "fisico") || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-accent-muted border border-accent/20 rounded-full px-4 py-1.5 mb-4">
            <Gift size={14} className="text-accent" />
            <span className="text-accent text-xs font-semibold">Catálogo de premios</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-text-primary mb-3">
            Premios reales
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base mb-6">
            Acumula puntos prediciendo resultados deportivos o completando tareas y canjéalos por estos premios.
          </p>
          <Link href="/auth/register">
            <Button size="lg">Empezar gratis — 1.000 puntos</Button>
          </Link>
        </div>

        {/* Rewards sections */}
        {rewards && rewards.length > 0 ? (
          <>
            {digitalRewards.length > 0 && (
              <section className="mb-10">
                <h2 className="font-semibold text-lg text-text-primary mb-1">Premios Digitales</h2>
                <p className="text-text-muted text-xs mb-4">Códigos, suscripciones y créditos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {digitalRewards.map((reward) => (
                    <RewardCard key={reward.id} reward={reward} />
                  ))}
                </div>
              </section>
            )}

            {fisicosRewards.length > 0 && (
              <section className="mb-10">
                <h2 className="font-semibold text-lg text-text-primary mb-1">Premios Físicos</h2>
                <p className="text-text-muted text-xs mb-4">Artículos y gadgets</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fisicosRewards.map((reward) => (
                    <RewardCard key={reward.id} reward={reward} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-text-muted">
            <Gift size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">Próximamente</p>
            <p className="text-sm mt-1">Los premios del catálogo se publicarán pronto.</p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 bg-surface border border-accent/20 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-accent-glow opacity-20 pointer-events-none" />
          <div className="relative">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-text-primary mb-3">
              ¿Quieres canjear alguno?
            </h2>
            <p className="text-text-secondary mb-6 text-sm sm:text-base">
              Regístrate gratis, consigue tus primeros 1.000 puntos y empieza a acumular.
            </p>
            <Link href="/auth/register">
              <Button size="lg">Crear cuenta gratuita</Button>
            </Link>
            <p className="text-text-muted text-xs mt-3">Sin tarjeta de crédito · Sin riesgo</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center space-y-3">
        <p className="text-text-muted text-sm">
          © 2025 SharpBet. Plataforma de predicciones con puntos virtuales.{" "}
          <span className="text-accent font-medium">Sin dinero real.</span>
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-text-muted">
          <Link href="/legal/terms" className="hover:text-text-primary transition">Términos y condiciones</Link>
          <Link href="/legal/privacy" className="hover:text-text-primary transition">Política de privacidad</Link>
          <Link href="/contact" className="hover:text-text-primary transition">Contacto</Link>
        </div>
      </footer>
    </div>
  );
}

function RewardCard({ reward }: { reward: Reward }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col hover:border-accent/30 transition-colors">
      {reward.imagen_url && (
        <div className="w-full h-44 overflow-hidden bg-surface-2">
          <img
            src={reward.imagen_url}
            alt={reward.nombre}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary text-sm mb-1">{reward.nombre}</h3>
            <p className="text-text-muted text-xs leading-snug">{reward.descripcion}</p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap flex-shrink-0 ${
              reward.categoria === "digital"
                ? "bg-blue/15 text-blue"
                : "bg-gold/15 text-gold"
            }`}
          >
            {reward.categoria === "digital" ? "Digital" : "Físico"}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-text-muted" />
            <span className="text-accent font-bold text-sm">{formatPoints(reward.puntos_necesarios)}</span>
            <span className="text-text-muted text-xs">pts</span>
          </div>
          <Link href="/auth/register">
            <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-muted text-accent border border-accent/20 hover:bg-accent hover:text-background transition-colors">
              Quiero este
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
