import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BackButton } from "@/components/ui/BackButton";
import { Mail, Clock, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Contacto — SharpBet",
  description: "Contacta con el equipo de SharpBet para resolver dudas, reportar problemas o hacer sugerencias. Respondemos en menos de 48 horas.",
  alternates: { canonical: "https://www.sharpbet.es/contact" },
  openGraph: {
    title: "Contacto — SharpBet",
    description: "¿Tienes alguna pregunta? Contacta con nuestro equipo.",
    url: "https://www.sharpbet.es/contact",
    siteName: "SharpBet",
    locale: "es_ES",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-28 pb-20">
        <BackButton fallback="/dashboard" />

        <h1 className="font-display font-black text-3xl text-text-primary mb-2">Contacto</h1>
        <p className="text-text-secondary text-sm mb-10">
          ¿Tienes alguna pregunta, sugerencia o incidencia? Estamos aquí para ayudarte.
        </p>

        {/* Contact card */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
              <Mail size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-text-primary font-semibold mb-1">Correo electrónico</p>
              <a
                href="mailto:info@sharpbet.es"
                className="text-accent hover:underline text-sm"
              >
                info@sharpbet.es
              </a>
              <p className="text-text-muted text-xs mt-1">
                Para consultas generales, problemas con tu cuenta o cualquier duda.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue/10 rounded-xl flex items-center justify-center shrink-0">
              <Clock size={18} className="text-blue" />
            </div>
            <div>
              <p className="text-text-primary font-semibold mb-1">Tiempo de respuesta</p>
              <p className="text-text-secondary text-sm">
                Respondemos en un plazo máximo de <strong className="text-text-primary">48 horas</strong> en días laborables.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="font-semibold text-text-primary text-lg mb-4">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="bg-surface border border-border rounded-xl group"
            >
              <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer text-sm font-medium text-text-primary list-none select-none">
                <span className="flex items-center gap-2">
                  <MessageSquare size={13} className="text-text-muted shrink-0" />
                  {item.q}
                </span>
                <span className="text-text-muted text-lg leading-none group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="px-4 pb-4 text-text-secondary text-sm leading-relaxed">{item.a}</p>
            </details>
          ))}
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

const FAQ = [
  {
    q: "¿SharpBet usa dinero real?",
    a: "No. SharpBet funciona exclusivamente con puntos virtuales sin valor monetario. No es necesario pagar ni depositar dinero en ningún momento.",
  },
  {
    q: "¿Cómo puedo ganar más puntos?",
    a: "Puedes ganar puntos acertando predicciones deportivas, completando ofertas y tareas en la sección 'Ganar puntos', y mediante promociones especiales que se anuncian periódicamente.",
  },
  {
    q: "He perdido todos mis puntos, ¿qué hago?",
    a: "Si tu saldo llega a cero, al día siguiente recibirás automáticamente 1.000 puntos de recuperación para que puedas seguir jugando.",
  },
  {
    q: "¿Cómo puedo canjear mis puntos?",
    a: "Desde la sección 'Recompensas' puedes ver el catálogo de premios disponibles y solicitar un canje. Un administrador procesará tu solicitud y te contactará por correo electrónico.",
  },
  {
    q: "¿Cómo elimino mi cuenta?",
    a: "Puedes solicitar la eliminación de tu cuenta escribiéndonos a info@sharpbet.es con el asunto 'Eliminar cuenta'. Borraremos todos tus datos en un plazo máximo de 30 días.",
  },
];
