import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ChevronLeft } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-8 transition-colors"
        >
          <ChevronLeft size={14} /> Volver al inicio
        </Link>
        {children}
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
