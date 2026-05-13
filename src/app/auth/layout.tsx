import { Navbar } from "@/components/layout/Navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen pt-16 px-4 py-10">
        <div className="relative w-full max-w-md">
          {/* Background glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          {children}
        </div>
      </div>
    </div>
  );
}
