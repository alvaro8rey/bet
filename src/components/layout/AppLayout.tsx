import Link from "next/link";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Términos" },
  { href: "/legal/privacy", label: "Privacidad" },
  { href: "/contact", label: "Contacto" },
  { href: "/como-ganar-puntos", label: "Cómo ganar puntos" },
];

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 lg:ml-64 pb-24 lg:pb-0">
          <div className="max-w-5xl mx-auto px-4 py-6">
            {children}
          </div>
          {/* Legal footer — visible on mobile only (sidebar has its own) */}
          <div className="lg:hidden flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 pb-4 pt-2">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-[10px] text-text-muted hover:text-text-secondary transition">
                {l.label}
              </Link>
            ))}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
