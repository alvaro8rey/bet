import { Navbar } from "@/components/layout/Navbar";
import { BackButton } from "@/components/ui/BackButton";
import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <BackButton fallback="/dashboard" />
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
