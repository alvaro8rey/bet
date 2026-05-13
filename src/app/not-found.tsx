import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-display font-black text-accent mb-4">404</p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Página no encontrada</h1>
        <p className="text-text-muted mb-8">La página que buscas no existe o ha sido movida.</p>
        <Link href="/dashboard">
          <Button size="lg">Ir al Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
