"use client";

import React from "react";
import { ExternalLink, Flame, Radio, User, History } from "lucide-react";
import { LiveEventDTO } from "@/types";
import { formatTimeOnly, formatRelativeTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

interface RecentEventsTimelineProps {
  events: LiveEventDTO[];
  onSelectEvent?: (event: LiveEventDTO) => void;
}

export function RecentEventsTimeline({ events, onSelectEvent }: RecentEventsTimelineProps) {
  return (
    <Card variant="default" className="flex flex-col justify-between text-right">
      <div>
        <CardHeader className="flex items-center justify-between pb-3">
          <CardTitle>
            <div className="p-1.5 rounded-lg bg-tiktok-red/10 text-tiktok-red border border-tiktok-red/20">
              <Flame className="w-4 h-4" />
            </div>
            <span>آخر عمليات الرصد اللحظية</span>
          </CardTitle>

          <Link href="/history" className="text-xs text-zinc-400 hover:text-tiktok-cyan flex items-center gap-1 font-bold">
            <History className="w-3.5 h-3.5" />
            <span>السجل الكامل</span>
          </Link>
        </CardHeader>

        <div className="space-y-3 max-h-[380px] overflow-y-auto pl-1">
          {events.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800">
              <Radio className="w-8 h-8 mx-auto mb-2 text-zinc-600 animate-pulse" />
              <p className="text-xs font-semibold text-zinc-300">في انتظار رصد دخول مشاهدين</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                عند دخول أي حساب من قائمة المراقبة إلى بث مباشر، سيتم تسجيله وعرضه هنا في أجزاء من الثانية.
              </p>
            </div>
          ) : (
            events.slice(0, 7).map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent?.(ev)}
                className="group relative p-3 rounded-xl bg-[#12141e] border border-zinc-800/80 hover:border-tiktok-red/40 hover:bg-[#161826] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative w-9 h-9 rounded-xl bg-zinc-800 overflow-hidden flex items-center justify-center border border-zinc-700 text-xs font-bold text-zinc-300">
                      {ev.monitoredAccount?.avatarUrl ? (
                        <img
                          src={ev.monitoredAccount.avatarUrl}
                          alt={ev.monitoredUsername}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <span className="font-bold text-tiktok-cyan hover:underline font-mono" dir="ltr">
                          @{ev.monitoredUsername}
                        </span>
                        <span className="text-[11px] text-zinc-400">دخل بث</span>
                        <span className="font-bold text-tiktok-red hover:underline font-mono" dir="ltr">
                          @{ev.hostUsername}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {ev.liveTitle || `بث مباشر للمضيف @${ev.hostUsername}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-left flex flex-col items-start font-mono">
                    <span className="text-[11px] text-zinc-400 font-bold">
                      {formatTimeOnly(ev.detectedAt)}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {formatRelativeTime(ev.detectedAt)}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {ev.detectionSource === "SIMULATION" ? "محاكاة" : "بث مباشر"}
                  </span>
                  <a
                    href={ev.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-tiktok-cyan hover:underline font-bold"
                  >
                    <span>مشاهدة البث</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-4 mt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
        <span className="text-zinc-500">تحديث تلقائي عبر SSE</span>
        <Link href="/history" className="text-tiktok-cyan hover:underline font-bold">
          عرض السجل كاملاً ←
        </Link>
      </div>
    </Card>
  );
}
