import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefixElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefixElement, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-zinc-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixElement && (
            <div className="absolute left-3.5 text-zinc-500 flex items-center pointer-events-none">
              {prefixElement}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full bg-[#12141d] border border-zinc-700/60 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition-colors",
              "focus:outline-none focus:border-tiktok-cyan/70 focus:ring-1 focus:ring-tiktok-cyan/50",
              "disabled:opacity-50 disabled:bg-zinc-900",
              prefixElement ? "pl-9" : "",
              error ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/30" : "",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
