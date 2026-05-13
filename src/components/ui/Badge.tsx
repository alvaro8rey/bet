import { cn } from "@/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "win" | "loss" | "pending" | "live" | "accent";
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = "default", className, dot }: BadgeProps) {
  const variants = {
    default: "bg-surface-3 text-text-secondary border border-border",
    win: "bg-win/10 text-win border border-win/20",
    loss: "bg-loss/10 text-loss border border-loss/20",
    pending: "bg-pending/10 text-pending border border-pending/20",
    live: "bg-loss/10 text-loss border border-loss/20",
    accent: "bg-accent-muted text-accent border border-accent/20",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
      variants[variant],
      className
    )}>
      {dot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full",
          variant === "live" ? "bg-loss animate-pulse" : "bg-current"
        )} />
      )}
      {children}
    </span>
  );
}
