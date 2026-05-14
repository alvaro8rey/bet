import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/layout/Navbar";
import { Trophy, Zap, Gift, ChevronRight, Star, Gamepad2, ShoppingBag, Smartphone } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-20 sm:pt-32 pb-12 sm:pb-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-accent-glow opacity-30 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent-muted border border-accent/20 rounded-full px-4 py-2 mb-8">
            <span className="text-accent text-xs font-semibold">🎁 Predice gratis · Gana premios reales</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-8xl text-text-primary leading-none mb-6 tracking-tight">
            PREDICE.
            <br />
            <span className="text-gradient-accent">ACUMULA.</span>
            <br />
            GANA PREMIOS.
          </h1>

          <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Haz predicciones deportivas, acumula puntos y canjéalos por premios reales.
            <span className="text-text-primary font-medium"> Sin dinero real, sin riesgo.</span>
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

      {/* Prizes showcase */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-1.5 mb-4">
              <Gift size={14} className="text-accent" />
              <span className="text-accent text-xs font-semibold">Catálogo de premios</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-text-primary mb-3">
              Premios reales que puedes ganar
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base">
              Canjea tus puntos por tarjetas regalo, productos digitales, gadgets y mucho más.
            </p>
          </div>

          {/* Prize categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[
              {
                icon: <ShoppingBag size={28} className="text-accent" />,
                label: "Tarjetas regalo",
                examples: "Amazon, FNAC, El Corte Inglés…",
                bg: "from-accent/10 to-accent/5",
                border: "border-accent/20",
              },
              {
                icon: <Gamepad2 size={28} className="text-blue" />,
                label: "Gaming",
                examples: "PSN, Xbox, Steam…",
                bg: "from-blue/10 to-blue/5",
                border: "border-blue/20",
              },
              {
                icon: <Smartphone size={28} className="text-pending" />,
                label: "Tecnología",
                examples: "Gadgets, accesorios…",
                bg: "from-pending/10 to-pending/5",
                border: "border-pending/20",
              },
              {
                icon: <Star size={28} className="text-gold" />,
                label: "Premium digital",
                examples: "Suscripciones, créditos…",
                bg: "from-gold/10 to-gold/5",
                border: "border-gold/20",
              },
            ].map((cat) => (
              <div
                key={cat.label}
                className={`bg-gradient-to-br ${cat.bg} border ${cat.border} rounded-2xl p-5 text-center hover:scale-[1.02] transition-transform`}
              >
                <div className="w-14 h-14 bg-surface/80 rounded-xl flex items-center justify-center mx-auto mb-3">
                  {cat.icon}
                </div>
                <p className="font-semibold text-text-primary text-sm mb-1">{cat.label}</p>
                <p className="text-text-muted text-xs leading-snug">{cat.examples}</p>
              </div>
            ))}
          </div>

          {/* CTA inside prizes section */}
          <div className="text-center">
            <Link href="/auth/register">
              <button className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:gap-3 transition-all">
                Ver todos los premios disponibles
                <ChevronRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 px-4 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="font-display font-black text-2xl sm:text-4xl text-text-primary mb-3">
              Tres pasos para ganar
            </h2>
            <p className="text-text-secondary text-sm sm:text-base">
              De cero a tu primer premio en minutos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px bg-gradient-to-r from-accent/30 via-accent/60 to-accent/30" />

            {[
              {
                step: "01",
                icon: <Zap size={24} className="text-accent" />,
                title: "Regístrate y gana puntos",
                description:
                  "Obtén 1.000 puntos al registrarte. Consigue más completando tareas fáciles: encuestas, ofertas, vídeos…",
                color: "text-accent",
                bg: "bg-accent-muted",
                border: "border-accent/20",
              },
              {
                step: "02",
                icon: <Trophy size={24} className="text-blue" />,
                title: "Predice y multiplícalos",
                description:
                  "Apuesta tus puntos en eventos deportivos reales. Si aciertas, multiplicas tu saldo.",
                color: "text-blue",
                bg: "bg-blue/10",
                border: "border-blue/20",
              },
              {
                step: "03",
                icon: <Gift size={24} className="text-gold" />,
                title: "Canjea por premios",
                description:
                  "Con suficientes puntos, elige tu premio favorito del catálogo y lo recibirás directamente.",
                color: "text-gold",
                bg: "bg-gold/10",
                border: "border-gold/20",
              },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 ${item.bg} border ${item.border} rounded-2xl flex items-center justify-center mb-5 relative z-10`}>
                  {item.icon}
                </div>
                <div className={`font-display font-black text-xs ${item.color} mb-2 tracking-widest`}>
                  PASO {item.step}
                </div>
                <h3 className="font-bold text-text-primary text-base sm:text-lg mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earn points highlight */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-accent-muted border border-accent/20 rounded-full px-3 py-1 mb-4">
                  <Zap size={12} className="text-accent" />
                  <span className="text-accent text-xs font-semibold">Gana puntos sin apostar</span>
                </div>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-text-primary mb-4">
                  Más formas de acumular puntos
                </h2>
                <p className="text-text-secondary text-sm sm:text-base leading-relaxed mb-6">
                  No solo puedes ganar puntos prediciendo resultados deportivos. Nuestra sección
                  <span className="text-text-primary font-medium"> "Ganar Puntos"</span> te permite
                  completar tareas sencillas y acumular miles de puntos extra para canjear antes.
                </p>
                <ul className="space-y-2 text-sm text-text-secondary">
                  {[
                    "Completa encuestas rápidas",
                    "Registrarte en ofertas y servicios",
                    "Ver vídeos patrocinados",
                    "Descargar apps o juegos",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-accent-muted border border-accent/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-accent text-xs">✓</span>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Encuesta", pts: "+200 pts", color: "text-accent" },
                  { label: "App descarga", pts: "+500 pts", color: "text-blue" },
                  { label: "Registro", pts: "+1.000 pts", color: "text-pending" },
                  { label: "Vídeo", pts: "+50 pts", color: "text-gold" },
                ].map((task) => (
                  <div
                    key={task.label}
                    className="bg-surface-2 border border-border rounded-2xl p-4 text-center hover:border-accent/20 transition-colors"
                  >
                    <p className="text-text-muted text-xs mb-1">{task.label}</p>
                    <p className={`font-bold text-base ${task.color}`}>{task.pts}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-surface/50 py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          {[
            { value: "100%", label: "Gratis para jugar" },
            { value: "0€", label: "Sin dinero real" },
            { value: "4+", label: "Deportes disponibles" },
            { value: "∞", label: "Premios canjeables" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-display font-black text-accent">{stat.value}</p>
              <p className="text-text-muted text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto bg-surface border border-accent/20 rounded-3xl p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-accent-glow opacity-20 pointer-events-none" />
          <div className="relative">
            <div className="text-4xl mb-4">🏆</div>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-text-primary mb-4">
              Tu primer premio te espera
            </h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Regístrate gratis, recibe 1.000 puntos y empieza a acumular hacia tu primer canje.
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="text-base px-10">
                Crear cuenta gratuita
              </Button>
            </Link>
            <p className="text-text-muted text-xs mt-4">Sin tarjeta de crédito · Sin riesgo</p>
          </div>
        </div>
      </section>

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
          <Link href="/como-ganar-puntos" className="hover:text-text-primary transition">Cómo ganar puntos</Link>
        </div>
      </footer>
    </div>
  );
}

export const dynamic = "force-dynamic";
