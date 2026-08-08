"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Trash2,
  Power,
  Tv,
  Radio,
  PlayCircle,
} from "lucide-react";
import { MonitoredAccountDTO } from "@/types";
import { formatDate, formatRelativeTime, formatTikTokUrl } from "@/lib/utils";
import { MonitoringStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface AccountCardProps {
  account: MonitoredAccountDTO;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSimulate: (username: string) => void;
}

export function AccountCard({
  account,
  onToggleActive,
  onDelete,
  onSimulate,
}: AccountCardProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggleActive(account.id, !account.isActive);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`هل أنت متأكد من حذف الحساب @${account.username} من قائمة المراقبة؟`)) {
      setLoading(true);
      try {
        await onDelete(account.id);
      } finally {
        setLoading(false);
      }
    }
  };

  const isLiveDetected = account.status === "LIVE_DETECTED";

  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-200 border relative overflow-hidden text-right ${
        isLiveDetected
          ? "bg-gradient-to-bl from-[#1c1420] via-[#161823] to-[#161823] border-tiktok-red/50 shadow-xl shadow-tiktok-red/10"
          : "bg-[#161823]/80 border-zinc-800/80 hover:border-zinc-700"
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center font-bold text-base text-zinc-300 shadow-inner font-mono">
            {account.avatarUrl ? (
              <img
                src={account.avatarUrl}
                alt={account.username}
                className="w-full h-full object-cover"
              />
            ) : (
              account.username.substring(0, 2).toUpperCase()
            )}
            {account.isActive && isLiveDetected && (
              <span className="absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full bg-tiktok-red border-2 border-[#161823] animate-pulse" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-white tracking-tight font-mono" dir="ltr">
                @{account.username}
              </h4>
              <a
                href={formatTikTokUrl(account.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-tiktok-cyan transition-colors"
                title="فتح الملف الشخصي في تيك توك"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {account.nickname && account.nickname !== account.username && (
              <p className="text-xs text-zinc-400">{account.nickname}</p>
            )}
          </div>
        </div>

        <MonitoringStatusBadge status={account.status} />
      </div>

      {/* Live Activity Highlight when detected */}
      {isLiveDetected && account.currentHost && (
        <div className="mb-4 p-3 rounded-xl bg-tiktok-red/10 border border-tiktok-red/30 space-y-1.5 animate-pulse-glow">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-tiktok-red flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>يشاهد بث مباشر حالياً</span>
            </span>
            <span className="text-zinc-400 font-mono text-[11px]">
              {formatRelativeTime(account.lastDetectedAt)}
            </span>
          </div>

          <div className="text-xs text-zinc-200">
            <span className="text-zinc-400">المضيف (صاحب البث): </span>
            <span className="font-bold text-white font-mono" dir="ltr">@{account.currentHost}</span>
          </div>

          {account.currentLiveTitle && (
            <p className="text-[11px] text-zinc-300 line-clamp-1">
              "{account.currentLiveTitle}"
            </p>
          )}

          {account.currentLiveUrl && (
            <a
              href={account.currentLiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-tiktok-cyan hover:underline mt-1"
            >
              <span>مشاهدة البث الآن</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Meta timestamps */}
      <div className="space-y-1.5 py-3 border-t border-zinc-800/80 text-xs text-zinc-400">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">آخر فحص:</span>
          <span className="font-mono text-zinc-300">
            {formatRelativeTime(account.lastCheckedAt)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">آخر دخول للبث:</span>
          <span className="font-mono text-zinc-300">
            {formatDate(account.lastDetectedAt)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">إجمالي عمليات الرصد:</span>
          <span className="font-bold text-zinc-200 font-mono">
            {account._count?.liveEvents || 0} مرة
          </span>
        </div>
      </div>

      {/* Bottom Action Toolbar */}
      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
        <Button
          variant={account.isActive ? "secondary" : "ghost"}
          size="sm"
          onClick={handleToggle}
          loading={loading}
          className={`text-xs gap-1.5 font-bold ${
            account.isActive ? "text-emerald-400 hover:text-emerald-300" : "text-zinc-500"
          }`}
          title={account.isActive ? "إيقاف المراقبة مؤقتاً" : "استئناف المراقبة"}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{account.isActive ? "نشط" : "موقوف"}</span>
        </Button>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSimulate(account.username)}
            className="text-xs text-tiktok-cyan hover:bg-tiktok-cyan/10 px-2.5 font-bold"
            title="اختبار محاكاة رصد هذا الحساب"
          >
            <PlayCircle className="w-3.5 h-3.5 ml-1" />
            <span>تجربة</span>
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={loading}
            className="px-2"
            title="حذف الحساب"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
