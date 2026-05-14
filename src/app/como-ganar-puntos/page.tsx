import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BackButton } from "@/components/ui/BackButton";
import { Trophy, Zap, Gift, TrendingUp, Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Cómo ganar puntos — SharpBet" };

export default function ComoGanarPuntosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <BackButton fallback="/dashboard" />

        <div className="text-center mb-12">
          <h1 className="font-display font-black text-4xl text-text-primary mb-3">Cómo ganar puntos</h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            En SharpBet puedes acumular puntos virtuales de varias formas.
            Cuantos más puntos tengas, más podrás apostar y mejores recompensas podrás canjear.
          </p>
        </div>

        {/* Methods */}
        <div className="space-y-4 mb-12">
          <Method
            icon={<Zap size={22} className="text-accent" />}
            color="accent"
            title="Puntos de bienvenida"
            badge="Una vez"
            description="Al crear tu cuenta recibes automáticamente 1.000 puntos para empezar a predecir desde el primer momento. No necesitas hacer nada, los puntos se añaden al registrarte."
          />
          <Method
            icon={<TrendingUp size={22} className="text-blue" />}
            color="blue"
            title="Acertar predicciones deportivas"
            badge="Sin límite"
            description="Cada vez que aciertas el resultado de un evento deportivo, ganas tus puntos apostados multiplicados por la cuota del resultado. Por ejemplo: 500 pts × cuota 2.10 = 1.050 pts. Cuanto mayor sea la cuota, mayor la recompensa si aciertas."
          />
          <Method
            icon={<Star size={22} className="text-pending" />}
            color="pending"
            title="Ofertas y tareas (Ganar puntos)"
            badge="Diariamente"
            description="En la sección 'Ganar puntos' encontrarás un panel con decenas de ofertas: instalar aplicaciones, registrarte en servicios, responder encuestas o ver vídeos. Cada tarea tiene un valor en puntos claramente indicado antes de aceptarla. Los puntos se acreditan en cuanto el proveedor confirma la finalización."
          />
          <Method
            icon={<RefreshCw size={22} className="text-accent" />}
            color="accent"
            title="Recuperación tras quiebra"
            badge="Automático"
            description="Si tu saldo llega a 0 puntos, al día siguiente recibes automáticamente 1.000 puntos de recuperación. Así nunca quedas completamente fuera del juego."
          />
          <Method
            icon={<Gift size={22} className="text-blue" />}
            color="blue"
            title="Promociones especiales"
            badge="Periódico"
            description="De vez en cuando el equipo de SharpBet añade puntos bonus por logros especiales, eventos destacados o promociones temporales. Sigue el ranking para estar al tanto de las novedades."
          />
        </div>

        {/* Points value */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-10">
          <div className="flex items-start gap-3 mb-4">
            <Trophy size={20} className="text-pending mt-0.5 shrink-0" />
            <h2 className="font-semibold text-text-primary">¿Para qué sirven los puntos?</h2>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed mb-4">
            Los puntos acumulados tienen dos usos principales:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-surface-2 rounded-xl p-4 border border-border">
              <p className="font-medium text-text-primary text-sm mb-1">Apostar en eventos</p>
              <p className="text-text-muted text-xs">Usa tus puntos para predecir resultados deportivos y multiplicarlos con las cuotas.</p>
            </div>
            <div className="bg-surface-2 rounded-xl p-4 border border-border">
              <p className="font-medium text-text-primary text-sm mb-1">Canjear recompensas</p>
              <p className="text-text-muted text-xs">Gasta tus puntos en el catálogo de recompensas: tarjetas regalo, productos digitales y más.</p>
            </div>
          </div>
        </div>

        {/* Important notice */}
        <div className="bg-pending/5 border border-pending/20 rounded-2xl p-5 mb-10">
          <p className="text-pending font-semibold text-sm mb-1">Aviso importante</p>
          <p className="text-text-secondary text-sm leading-relaxed">
            Los puntos de SharpBet son <strong className="text-text-primary">exclusivamente virtuales</strong> y
            no tienen valor monetario ni pueden convertirse en dinero real. SharpBet es una plataforma
            de entretenimiento, no un servicio de apuestas con dinero real.
          </p>
        </div>

        <div className="text-center">
          <Link href="/auth/register">
            <Button size="lg">Empezar a ganar puntos</Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-6 px-4 text-center">
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

function Method({
  icon, color, title, badge, description,
}: {
  icon: React.ReactNode;
  color: "accent" | "blue" | "pending";
  title: string;
  badge: string;
  description: string;
}) {
  const bg = { accent: "bg-accent/10", blue: "bg-blue/10", pending: "bg-pending/10" }[color];
  const badgeCls = {
    accent: "bg-accent/10 text-accent border-accent/20",
    blue: "bg-blue/10 text-blue border-blue/20",
    pending: "bg-pending/10 text-pending border-pending/20",
  }[color];

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex gap-4">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-semibold text-text-primary">{title}</p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeCls}`}>{badge}</span>
        </div>
        <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
