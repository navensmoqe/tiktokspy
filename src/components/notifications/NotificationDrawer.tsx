"use client";

import React from "react";
import { X, CheckCheck, Bell, Radio, ExternalLink, Clock } from "lucide-react";
import { NotificationDTO } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationDTO[];
  onMarkAllAsRead: () => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-md bg-[#12141d] border-r border-zinc-800 shadow-2xl flex flex-col text-right">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#161823]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-tiktok-red/10 border border-tiktok-red/20 text-tiktok-red">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">تنبيهات البث المباشر</h3>
                <p className="text-xs text-zinc-400">سجل إشعارات دخول المشاهدين فورياً</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs text-zinc-400 hover:text-tiktok-cyan font-bold"
                title="تحديد الكل كمقروء"
              >
                <CheckCheck className="w-4 h-4 ml-1" />
                <span>قراءة الكل</span>
              </Button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-zinc-500">
                <Radio className="w-12 h-12 stroke-1 mb-3 text-zinc-600" />
                <p className="text-sm font-bold text-zinc-400">لا توجد تنبيهات حتى الآن</p>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  عند رصد دخول أي حساب مراقب إلى بث مباشر، ستظهر التنبيهات هنا فورياً.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition-all ${
                    !n.isRead
                      ? "bg-[#181a27] border-tiktok-red/30 shadow-md shadow-tiktok-red/5"
                      : "bg-[#141620] border-zinc-800/80 text-zinc-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-tiktok-red" />
                      <span className="text-xs font-bold text-white">{n.title}</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 mb-2 leading-relaxed">{n.message}</p>

                  {n.liveEvent && (
                    <a
                      href={n.liveEvent.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-tiktok-cyan hover:underline"
                    >
                      <span>الانتقال للبث</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
