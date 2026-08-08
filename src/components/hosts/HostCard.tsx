"use client";

import React, { useState } from "react";
import { ExternalLink, Trash2, Power, Radio, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { TargetHostDTO } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface HostCardProps {
  host: TargetHostDTO;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function HostCard({ host, onToggleActive, onDelete }: HostCardProps) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ isLive: boolean; message: string } | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggleActive(host.id, !host.isActive);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/hosts/${host.id}/test`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setTestResult({ isLive: json.isLive, message: json.message });
      } else {
        setTestResult({ isLive: false, message: json.error || "فشل الفحص" });
      }
    } catch (e) {
      setTestResult({ isLive: false, message: "تعذر فحص الاتصال بالخادم" });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`هل تريد حذف قناة البث @${host.hostUsername} من قائمة المراقبة؟`)) {
      setLoading(true);
      try {
        await onDelete(host.id);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="rounded-2xl p-5 bg-[#161823]/80 border border-zinc-800/80 hover:border-zinc-700 transition-all text-right space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center font-bold text-base text-zinc-300 font-mono">
            {host.avatarUrl ? (
              <img src={host.avatarUrl} alt={host.hostUsername} className="w-full h-full object-cover" />
            ) : (
              host.hostUsername.substring(0, 2).toUpperCase()
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-white tracking-tight font-mono" dir="ltr">@{host.hostUsername}</h4>
              <a
                href={`https://www.tiktok.com/@${host.hostUsername}/live`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-tiktok-cyan"
                title="فتح صفحة البث في تيك توك"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {host.nickname && <p className="text-xs text-zinc-400">{host.nickname}</p>}
          </div>
        </div>

        {host.isLive ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-tiktok-red/10 text-tiktok-red border border-tiktok-red/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-tiktok-red" />
            <span>مباشر الآن</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            <span>قيد الاستماع</span>
          </span>
        )}
      </div>

      <div className="py-2.5 my-2 border-y border-zinc-800/60 text-xs text-zinc-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">حالة الرادار:</span>
          <span className="font-bold text-zinc-300">
            {host.isActive ? "🟢 يستمع لحزم الدخول" : "⚪ موقوف"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">آخر تحديث:</span>
          <span className="font-mono text-zinc-400">{formatRelativeTime(host.updatedAt)}</span>
        </div>
      </div>

      {testResult && (
        <div
          className={`p-2.5 rounded-xl text-xs font-bold flex items-start gap-2 ${
            testResult.isLive
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-zinc-800/80 border border-zinc-700 text-zinc-300"
          }`}
        >
          {testResult.isLive ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <span className="leading-tight">{testResult.message}</span>
        </div>
      )}

      <div className="pt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={host.isActive ? "secondary" : "ghost"}
            size="sm"
            onClick={handleToggle}
            loading={loading}
            className={`text-xs gap-1.5 font-bold ${host.isActive ? "text-emerald-400" : "text-zinc-500"}`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{host.isActive ? "نشط" : "موقوف"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            loading={testing}
            className="text-xs gap-1 font-bold text-tiktok-cyan border-tiktok-cyan/30 hover:bg-tiktok-cyan/10"
            title="فحص الاتصال بغرفة البث في تيك توك الآن"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>فحص البث</span>
          </Button>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          loading={loading}
          className="px-2"
          title="حذف القناة"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
