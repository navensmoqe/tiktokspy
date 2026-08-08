"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LiveEventDTO } from "@/types";
import { formatDate, formatDuration } from "@/lib/utils";
import { ExternalLink, Radio, Code } from "lucide-react";

interface EventDetailModalProps {
  event: LiveEventDTO | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  if (!event) return null;

  let parsedMetadata: any = null;
  try {
    if (event.metadataJson) {
      parsedMetadata = JSON.parse(event.metadataJson);
    }
  } catch {}

  return (
    <Modal
      isOpen={!!event}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-white">
          <Radio className="w-5 h-5 text-tiktok-red" />
          <span>تفاصيل حدث رصد الدخول للبث المباشر</span>
        </div>
      }
      description={`معرف الحدث الفريد: ${event.id}`}
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs text-right">
        {/* Core summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-[#10121a] border border-zinc-800 space-y-1">
            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
              المشاهد المراقب
            </span>
            <p className="text-sm font-bold text-tiktok-cyan font-mono" dir="ltr">@{event.monitoredUsername}</p>
            {event.monitoredAccount?.nickname && (
              <p className="text-zinc-400">{event.monitoredAccount.nickname}</p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-[#10121a] border border-zinc-800 space-y-1">
            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
              مضيف البث المباشر
            </span>
            <p className="text-sm font-bold text-tiktok-red font-mono" dir="ltr">@{event.hostUsername}</p>
            <p className="text-zinc-400 truncate">{event.liveTitle || "بث مباشر على تيك توك"}</p>
          </div>
        </div>

        {/* Timestamp metadata */}
        <div className="p-4 rounded-xl bg-[#10121a] border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">وقت الرصد الدقيق:</span>
            <span className="font-mono text-zinc-100">{formatDate(event.detectedAt)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">وقت الخروج من البث:</span>
            <span className="font-mono text-zinc-100">{event.exitAt ? formatDate(event.exitAt) : "نشط أو لم يتم الإشارة للخروج"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">مدة البقاء في البث:</span>
            <span className="font-mono text-zinc-100">{formatDuration(event.durationSeconds)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">مصدر الرصد / البروتوكول:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-tiktok-cyan font-mono font-bold">
              {event.detectionSource === "SIMULATION" ? "محاكاة" : "سوكت Webcast المباشر"}
            </span>
          </div>
        </div>

        {/* Direct Link */}
        <div className="p-3 rounded-xl bg-tiktok-cyan/5 border border-tiktok-cyan/20 flex items-center justify-between">
          <div className="truncate ml-2">
            <span className="text-[10px] uppercase text-zinc-400 block font-bold">رابط البث المباشر (LIVE URL)</span>
            <span className="text-xs text-zinc-200 font-mono truncate" dir="ltr">{event.liveUrl}</span>
          </div>
          <a
            href={event.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <Button variant="cyan" size="sm" className="font-bold">
              <span>فتح البث</span>
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
            </Button>
          </a>
        </div>

        {/* Raw Metadata JSON view */}
        {parsedMetadata && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
              <Code className="w-3.5 h-3.5" />
              <span>حزمة بيانات الحدث الأصلية (Payload):</span>
            </span>
            <pre className="p-3 rounded-xl bg-black/60 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-40 text-left" dir="ltr">
              {JSON.stringify(parsedMetadata, null, 2)}
            </pre>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="ghost" size="md" onClick={onClose} className="font-bold">
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
}
