import React from "react";
import { cn } from "@/lib/utils";
import { MonitoringStatus } from "@/types";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "warning" | "cyan" | "muted";
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  className,
  variant = "default",
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-zinc-800 text-zinc-300 border-zinc-700",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    danger: "bg-red-500/10 text-red-400 border-red-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    cyan: "bg-tiktok-cyan/10 text-tiktok-cyan border-tiktok-cyan/30",
    muted: "bg-zinc-900 text-zinc-500 border-zinc-800",
  };

  const dotStyles = {
    default: "bg-zinc-400",
    success: "bg-emerald-400",
    danger: "bg-red-400",
    warning: "bg-amber-400",
    cyan: "bg-tiktok-cyan",
    muted: "bg-zinc-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                dotStyles[variant]
              )}
            />
          )}
          <span className={cn("relative inline-flex rounded-full h-2 w-2", dotStyles[variant])} />
        </span>
      )}
      {children}
    </span>
  );
}

export function MonitoringStatusBadge({ status }: { status: MonitoringStatus }) {
  switch (status) {
    case "LIVE_DETECTED":
      return (
        <Badge variant="danger" dot pulse>
          🔴 تم رصد نشاط مباشر
        </Badge>
      );
    case "MONITORING":
      return (
        <Badge variant="success" dot pulse>
          🟢 قيد المراقبة
        </Badge>
      );
    case "IDLE":
      return (
        <Badge variant="muted" dot>
          ⚪ لا يوجد نشاط بث
        </Badge>
      );
    case "UNKNOWN":
    default:
      return (
        <Badge variant="warning" dot>
          🟡 غير معروف
        </Badge>
      );
  }
}
