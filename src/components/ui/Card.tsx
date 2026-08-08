import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "live" | "outline";
}

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  const variantStyles = {
    default: "bg-[#161823]/80 border border-zinc-800/80 backdrop-blur-md",
    elevated: "bg-[#1a1d2c]/90 border border-zinc-700/60 shadow-xl backdrop-blur-lg",
    live: "glass-alert-live",
    outline: "bg-transparent border border-zinc-800 hover:border-zinc-700",
  };

  return (
    <div
      className={cn("rounded-2xl p-5 transition-all duration-200", variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between pb-4 border-b border-zinc-800/60 mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-zinc-100 flex items-center gap-2", className)} {...props}>
      {children}
    </h3>
  );
}
