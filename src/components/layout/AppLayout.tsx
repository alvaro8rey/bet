import Link from "next/link";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { AdsterraUnit } from "@/components/ads/AdsterraUnit";

interface AppLayoutProps {
  children: React.ReactNode;
}

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Términos" },
  { href: "/legal/privacy", label: "Privacidad" },
  { href: "/contact", label: "Contacto" },
  { href: "/como-ganar-puntos", label: "Cómo ganar puntos" },
];

const ADSTERRA_300x250 = "789b5ee37dbebca06e32b1d84247c967";
const ADSTERRA_320x50  = "dae339dd05e406edbd65799672f60e96";

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col bg-background lg:block lg:min-h-screen" style={{ height: "100dvh" }}>
      <Navbar />
      <div className="flex flex-1 min-h-0 pt-16">
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto lg:overflow-visible lg:ml-64 min-w-0">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {children}
          </div>
          <div className="lg:hidden flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 pb-4 pt-2">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-[10px] text-text-muted hover:text-text-secondary transition">
                {l.href === "/legal/terms" ? "Términos" : l.label}
              </Link>
            ))}
          </div>
        </main>

        {/* Right ad column — desktop only */}
        {ADSTERRA_300x250 && (
          <aside className="hidden xl:flex flex-col w-[300px] flex-shrink-0 pt-6 pr-4">
            <div className="sticky top-20">
              <AdsterraUnit adKey={ADSTERRA_300x250} width={300} height={250} />
            </div>
          </aside>
        )}
      </div>

      {/* Mobile banner — 320x50 above bottom nav */}
      {ADSTERRA_320x50 && (
        <div className="lg:hidden flex justify-center bg-background border-t border-border/50">
          <AdsterraUnit adKey={ADSTERRA_320x50} width={320} height={50} />
        </div>
      )}

      <BottomNav />
    </div>
  );
}
