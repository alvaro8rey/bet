import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-accent-muted border border-accent/20 rounded-2xl flex items-center justify-center">
          <span className="text-xl">🎯</span>
        </div>
        <Spinner size="lg" />
        <p className="text-text-muted text-sm animate-pulse">Cargando PlayfulBet...</p>
      </div>
    </div>
  );
}
