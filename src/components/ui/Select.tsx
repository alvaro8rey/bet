import { cn } from "@/utils";
import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary",
            "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30",
            "transition-all duration-200 appearance-none cursor-pointer",
            error && "border-loss",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-2">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-loss">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
