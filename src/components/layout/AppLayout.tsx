import Link from "next/link";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { AdBanner } from "@/components/ads/AdBanner";

interface AppLayoutProps {
  children: React.ReactNode;
}

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Términos" },
  { href: "/legal/privacy", label: "Privacidad" },
  { href: "/contact", label: "Contacto" },
  { href: "/como-ganar-puntos", label: "Cómo ganar puntos" },
];

// TODO: replace with real Ad Slot IDs from AdSense dashboard once approved
const AD_SLOT_SIDEBAR = "0000000000";
const AD_SLOT_MOBILE  = "1111111111";

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
        <aside className="hidden xl:flex flex-col w-[300px] flex-shrink-0 pt-6 pr-4">
          <div className="sticky top-20">
            <AdBanner
              slot={AD_SLOT_SIDEBAR}
              format="vertical"
              className="w-[300px] min-h-[600px]"
            />
          </div>
        </aside>
      </div>

      <BottomNav />
    </div>
  );
}
