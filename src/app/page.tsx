import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/layout/Navbar";
import { Trophy, Zap, Shield, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-accent-glow opacity-30 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent-muted border border-accent/20 rounded-full px-4 py-2 mb-8">
            <span className="text-accent text-xs font-semibold">🎯 100% Puntos Virtuales — Sin dinero real</span>
          </div>

          <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl text-text-primary leading-none mb-6 tracking-tight">
            PREDICE.
            <br />
            <span className="text-gradient-accent">COMPITE.</span>
            <br />
            DOMINA.
          </h1>

          <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            La plataforma de predicciones deportivas más emocionante.
            Demuestra tu conocimiento deportivo sin riesgo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-base px-8">
                Empezar gratis — 1.000 puntos
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="secondary" className="text-base px-8">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-surface/50 py-6 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "4+", label: "Deportes" },
            { value: "1.000", label: "Puntos iniciales" },
            { value: "1", label: "Apuesta activa a la vez" },
            { value: "∞", label: "Competiciones" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-display font-black text-accent">{stat.value}</p>
              <p className="text-text-muted text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-black text-4xl text-center text-text-primary mb-12">
            ¿Cómo funciona?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Zap className="text-accent" size={24} />,
                title: "Empieza con 1.000 puntos",
                description: "Al registrarte recibes 1.000 puntos virtuales para empezar a predecir inmediatamente.",
              },
              {
                icon: <TrendingUp className="text-blue" size={24} />,
                title: "Predice y multiplica",
                description: "Elige el resultado de un evento deportivo, apuesta tus puntos y multiplícalos si aciertas.",
              },
              {
                icon: <Shield className="text-accent" size={24} />,
                title: "Una apuesta a la vez",
                description: "El sistema te permite tener solo una apuesta activa. Espera el resultado antes de la siguiente.",
              },
              {
                icon: <Trophy className="text-pending" size={24} />,
                title: "Sube en el ranking",
                description: "Compite con otros usuarios. Los mejores predictores escalan en la clasificación global.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="bg-surface border border-border rounded-2xl p-6 hover:border-border-light transition-all"
              >
                <div className="w-12 h-12 bg-surface-2 rounded-xl flex items-center justify-center mb-4">
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{feat.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto bg-surface border border-accent/20 rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-accent-glow opacity-20 pointer-events-none" />
          <h2 className="font-display font-black text-4xl text-text-primary mb-4 relative">
            ¿Listo para competir?
          </h2>
          <p className="text-text-secondary mb-8 relative">
            Únete y demuestra que sabes de deportes.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="relative">
              Crear cuenta gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center">
        <p className="text-text-muted text-sm">
          © 2025 PlayfulBet. Plataforma de predicciones con puntos virtuales.{" "}
          <span className="text-accent font-medium">Sin dinero real.</span>
        </p>
      </footer>
    </div>
  );
}
export const dynamic = "force-dynamic";
