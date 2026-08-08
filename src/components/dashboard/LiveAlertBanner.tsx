"use client";

import React, { useEffect, useState } from "react";
import {
  ExternalLink,
  X,
  Tv,
  Clock,
  Radio,
} from "lucide-react";
import { LiveEventDTO } from "@/types";
import { formatTimeOnly } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface LiveAlertBannerProps {
  alert: LiveEventDTO | null;
  onDismiss: () => void;
  autoDismissSeconds?: number;
}

export function LiveAlertBanner({
  alert,
  onDismiss,
  autoDismissSeconds = 12,
}: LiveAlertBannerProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!alert) return;

    setProgress(100);
    const durationMs = (autoDismissSeconds || 12) * 1000;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remainingPercent);

      if (elapsed >= durationMs) {
        clearInterval(timer);
        onDismiss();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [alert, autoDismissSeconds, onDismiss]);

  if (!alert) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl glass-alert-live p-5 mb-8 animate-slide-down shadow-2xl transition-all border border-tiktok-red/60 text-right">
      {/* Glow pulse background effect */}
      <div className="absolute -left-16 -top-16 w-56 h-56 rounded-full bg-tiktok-red/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -right-16 -bottom-16 w-56 h-56 rounded-full bg-tiktok-cyan/15 blur-3xl pointer-events-none" />

      {/* Progress countdown bar */}
      <div
        className="absolute bottom-0 right-0 h-1 bg-gradient-to-l from-tiktok-red via-tiktok-cyan to-tiktok-red transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Right (start in RTL) alert badge & main copy */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tiktok-red opacity-80" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-tiktok-red" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-tiktok-red bg-tiktok-red/10 px-2.5 py-0.5 rounded-full border border-tiktok-red/30">
              🔴 تم رصد نشاط مباشر (LIVE Activity Detected)
            </span>
            <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>وقت الرصد: {formatTimeOnly(alert.detectedAt)}</span>
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex flex-wrap items-center gap-2">
              <span className="text-zinc-300 text-sm font-normal">المستخدم</span>
              <span className="text-tiktok-cyan" dir="ltr">@{alert.monitoredUsername}</span>
              <span className="text-zinc-300 text-sm font-normal">دخل الآن بث مباشر للمضيف</span>
              <span className="text-tiktok-red" dir="ltr">@{alert.hostUsername}</span>
            </h2>

            {alert.liveTitle && (
              <p className="text-sm text-zinc-300 flex items-center gap-1.5 line-clamp-1">
                <Tv className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span>عنوان البث: {alert.liveTitle}</span>
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end">
          <a
            href={alert.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-initial"
          >
            <Button variant="primary" size="md" className="w-full gap-2 font-bold shadow-tiktok-red/40">
              <span>فتح البث في تيك توك</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>

          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="rounded-xl border border-zinc-700 hover:bg-zinc-800/80 text-zinc-400 hover:text-white"
            title="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
