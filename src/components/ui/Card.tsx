import { cn } from "@/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, glow, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-surface border border-border rounded-2xl shadow-card bg-card-shine",
        "relative overflow-hidden",
        hover && "hover:border-border-light hover:shadow-card-hover transition-all duration-300 cursor-pointer",
        glow && "border-accent/30 shadow-accent-sm",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-5 pt-5 pb-4 border-b border-border", className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
