"use client";

import React from "react";
import { ExternalLink, Eye, Radio, User } from "lucide-react";
import { LiveEventDTO } from "@/types";
import { formatDate, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface HistoryTableProps {
  events: LiveEventDTO[];
  onSelectEvent: (event: LiveEventDTO) => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export function HistoryTable({
  events,
  onSelectEvent,
  page,
  totalPages,
  total,
  onPageChange,
}: HistoryTableProps) {
  if (events.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#161823]/80 border border-zinc-800 text-zinc-500">
        <Radio className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
        <h4 className="text-base font-bold text-zinc-300">لا توجد سجلات رصد مطابقة</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          لم يتم العثور على أي أحداث تطابق الفلاتر الحالية. حاول تغيير كلمات البحث أو مصدر الحدث.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-right">
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[#161823]/90 shadow-xl">
        <table className="w-full text-right text-xs text-zinc-300">
          <thead className="bg-[#10121a] text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="px-5 py-3.5">المشاهد المراقب</th>
              <th className="px-5 py-3.5">مضيف البث</th>
              <th className="px-5 py-3.5 hidden md:table-cell">عنوان البث المباشر</th>
              <th className="px-5 py-3.5">وقت الرصد</th>
              <th className="px-5 py-3.5 hidden lg:table-cell">المدة</th>
              <th className="px-5 py-3.5">المصدر</th>
              <th className="px-5 py-3.5 text-left">إجراءات</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60 font-medium">
            {events.map((ev) => (
              <tr
                key={ev.id}
                className="hover:bg-zinc-800/40 transition-colors cursor-pointer"
                onClick={() => onSelectEvent(ev)}
              >
                {/* Monitored Viewer */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-xs overflow-hidden border border-zinc-700">
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
                      <span className="font-bold text-white block font-mono" dir="ltr">@{ev.monitoredUsername}</span>
                      {ev.monitoredAccount?.nickname && (
                        <span className="text-[10px] text-zinc-400">{ev.monitoredAccount.nickname}</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Host */}
                <td className="px-5 py-4">
                  <span className="font-bold text-tiktok-red font-mono" dir="ltr">@{ev.hostUsername}</span>
                </td>

                {/* Title */}
                <td className="px-5 py-4 hidden md:table-cell max-w-xs">
                  <span className="line-clamp-1 text-zinc-300">
                    {ev.liveTitle || `بث مباشر مع @${ev.hostUsername}`}
                  </span>
                </td>

                {/* Detected At */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="font-mono text-zinc-200">{formatDate(ev.detectedAt)}</div>
                </td>

                {/* Duration */}
                <td className="px-5 py-4 hidden lg:table-cell whitespace-nowrap">
                  <span className="text-zinc-400">{formatDuration(ev.durationSeconds)}</span>
                </td>

                {/* Source Badge */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ev.detectionSource === "SIMULATION"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {ev.detectionSource === "SIMULATION" ? "محاكاة" : "بث Webcast"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-left whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectEvent(ev)}
                      className="text-xs text-zinc-400 hover:text-white font-bold"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-3.5 h-3.5 ml-1" />
                      <span>تفاصيل</span>
                    </Button>

                    <a
                      href={ev.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-tiktok-cyan hover:bg-tiktok-cyan/10"
                      title="فتح البث المباشر"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-zinc-400">
          <div>
            عرض الصفحة <span className="font-bold text-white font-mono">{page}</span> من{" "}
            <span className="font-bold text-white font-mono">{totalPages}</span> (إجمالي{" "}
            <span className="font-mono">{total}</span> سجل)
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="font-bold"
            >
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="font-bold"
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
