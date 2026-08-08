"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio,
  Bell,
  Volume2,
  VolumeX,
  PlayCircle,
  Menu,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { audioAlert } from "@/components/ui/AudioAlertController";
import { BrowserNotificationHelper } from "@/components/ui/BrowserNotificationHelper";

interface NavbarProps {
  isConnected: boolean;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenSimulationModal: () => void;
  onToggleSidebar?: () => void;
}

export function Navbar({
  isConnected,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenSimulationModal,
  onToggleSidebar,
}: NavbarProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  useEffect(() => {
    if (BrowserNotificationHelper.isSupported() && typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      audioAlert.playSound("subtle", 60);
    }
  };

  const handleRequestNotifPermission = async () => {
    const granted = await BrowserNotificationHelper.requestPermission();
    setNotifPermission(granted ? "granted" : "denied");
    if (granted) {
      await BrowserNotificationHelper.send("🟢 تم تفعيل إشعارات الهاتف بنجاح!", {
        body: "ستتلقى تنبيهاً فورياً عند دخول أي حساب مراقب إلى بث مباشر على تيك توك.",
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#0f1015]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Right (start) branding */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-tiktok-red via-zinc-900 to-tiktok-cyan p-[1.5px] shadow-lg shadow-tiktok-cyan/10">
              <div className="w-full h-full bg-[#12141d] rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-tiktok-cyan animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-tiktok-cyan transition-colors">
                  رادار تيك توك <span className="text-tiktok-red">LIVE</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-tiktok-cyan/10 text-tiktok-cyan border border-tiktok-cyan/20 font-mono">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                مراقبة دخول المشاهدين إلى البث المباشر فورياً
              </p>
            </div>
          </Link>
        </div>

        {/* Left (end) action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time SSE Connection Indicator */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-md transition-all ${
              isConnected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected ? "bg-emerald-400" : "bg-red-400"
                }`}
              />
            </span>
            <span>{isConnected ? "الاتصال المباشر نشط" : "جارٍ الاتصال..."}</span>
          </div>

          {/* Quick Simulation Trigger */}
          <button
            onClick={onOpenSimulationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-tiktok-cyan/10 via-tiktok-cyan/20 to-tiktok-red/10 text-tiktok-cyan border border-tiktok-cyan/30 hover:border-tiktok-cyan/60 transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="تجربة محاكاة رصد دخول مشاهد إلى بث مباشر"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تجربة تنبيه</span>
          </button>

          {/* Sound Synthesizer Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? "bg-zinc-800/80 text-zinc-100 border-zinc-700 hover:bg-zinc-700"
                : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-400"
            }`}
            title={soundEnabled ? "التنبيهات الصوتية: مفعّلة" : "التنبيهات الصوتية: مكتومة"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-tiktok-cyan" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Mobile & Chrome Push Notification Button */}
          {notifPermission !== "granted" ? (
            <button
              onClick={handleRequestNotifPermission}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-sm animate-pulse"
              title="تفعيل إشعارات متصفح كروم على هاتفك"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>إشعارات الهاتف</span>
            </button>
          ) : (
            <button
              onClick={() => {
                BrowserNotificationHelper.send("🔴 تجربة إشعار تيك توك", {
                  body: "إشعارات كروم على الهاتف تعمل بنجاح مع الاهتزاز والصوت 📳",
                });
              }}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              title="اضغط لإرسال إشعار تجريبي للهاتف"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>إشعارات الهاتف مفعلة</span>
            </button>
          )}

          {/* Notification Drawer Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-700 transition-all"
            title="سجل التنبيهات"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-tiktok-red text-[10px] font-bold text-white shadow-md shadow-tiktok-red/40 animate-pulse font-mono">
                {unreadNotifsCount > 9 ? "9+" : unreadNotifsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
