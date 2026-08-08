"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings as SettingsIcon,
  Volume2,
  Sliders,
  ShieldCheck,
  Terminal,
  Save,
  RefreshCw,
  Sparkles,
  Key,
  Clock,
} from "lucide-react";
import { SystemLogDTO } from "@/types";
import { formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { audioAlert } from "@/components/ui/AudioAlertController";

export default function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState("radar");
  const [soundVolume, setSoundVolume] = useState(80);
  const [autoDismiss, setAutoDismiss] = useState(12);
  const [inactivityTimeout, setInactivityTimeout] = useState(60);
  const [streamProvider, setStreamProvider] = useState("auto");
  const [signApiKey, setSignApiKey] = useState("");
  const [signBasePath, setSignBasePath] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // System Logs
  const [logs, setLogs] = useState<SystemLogDTO[]>([]);
  const [logLevel, setLogLevel] = useState("ALL");
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setSoundEnabled(json.data.soundEnabled ?? true);
        setSoundType(json.data.soundType ?? "radar");
        setSoundVolume(json.data.soundVolume ?? 80);
        setAutoDismiss(json.data.autoDismissSeconds ?? 12);
        setInactivityTimeout(json.data.inactivityTimeoutSeconds ?? 60);
        setStreamProvider(json.data.streamProvider ?? "auto");
        setSignApiKey(json.data.signApiKey ?? "");
        setSignBasePath(json.data.signBasePath ?? "");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const params = new URLSearchParams();
      if (logLevel && logLevel !== "ALL") params.set("level", logLevel);
      params.set("limit", "50");

      const res = await fetch(`/api/logs?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  }, [logLevel]);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, [fetchSettings, fetchLogs]);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soundEnabled,
          soundType,
          soundVolume,
          autoDismissSeconds: autoDismiss,
          inactivityTimeoutSeconds: inactivityTimeout,
          streamProvider,
          signApiKey,
          signBasePath,
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-tiktok-cyan" />
            <span>الإعدادات وحساب مدة البقاء والخروج</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            تخصيص نغمات التنبيه الصوتية، فترات رصد الخروج، مفاتيح التوقيع، وعرض سجلات النظام.
          </p>
        </div>

        <Button
          variant="cyan"
          size="md"
          onClick={handleSaveSettings}
          loading={saving}
          className="gap-2 font-bold shadow-tiktok-cyan/20 self-start sm:self-auto"
        >
          <Save className="w-4 h-4 ml-1" />
          <span>حفظ الإعدادات</span>
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-2 animate-slide-down">
          <Sparkles className="w-4 h-4 ml-1" />
          <span>تم حفظ الإعدادات بنجاح!</span>
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alert & Sound Preferences */}
        <Card variant="default" className="space-y-5 text-right">
          <CardHeader className="pb-3">
            <CardTitle>
              <Volume2 className="w-4 h-4 text-tiktok-cyan" />
              <span>تفضيلات الصوت والتنبيهات</span>
            </CardTitle>
          </CardHeader>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">تفعيل التنبيهات الصوتية</p>
              <p className="text-[11px] text-zinc-400">تشغيل نغمة فورية عند رصد دخول الحساب للبث المباشر</p>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-5 h-5 accent-tiktok-cyan rounded cursor-pointer"
            />
          </div>

          {/* Sound Type Selection */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <label className="block text-xs font-bold text-zinc-300">
              نوع نغمة التنبيه المولد
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "radar", name: "مسح الرادار" },
                { id: "chime", name: "رنين نغمي" },
                { id: "alarm", name: "إنذار طوارئ" },
                { id: "subtle", name: "نبضة هادئة" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSoundType(s.id);
                    audioAlert.playSound(s.id as any, soundVolume);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-right flex items-center justify-between ${
                    soundType === s.id
                      ? "bg-tiktok-cyan/10 text-tiktok-cyan border-tiktok-cyan/40"
                      : "bg-[#12141e] text-zinc-400 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <span>{s.name}</span>
                  <Volume2 className="w-3.5 h-3.5 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-zinc-300">مستوى الصوت</span>
              <span className="font-mono text-zinc-400">{soundVolume}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={soundVolume}
              onChange={(e) => setSoundVolume(parseInt(e.target.value))}
              className="w-full accent-tiktok-cyan cursor-pointer"
            />
          </div>

          {/* Auto Dismiss Slider */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-zinc-300">مدة بقاء شريط التنبيه</span>
              <span className="font-mono text-zinc-400">{autoDismiss} ثوانٍ</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              value={autoDismiss}
              onChange={(e) => setAutoDismiss(parseInt(e.target.value))}
              className="w-full accent-tiktok-cyan cursor-pointer"
            />
          </div>
        </Card>

        {/* Departure & Engine Config */}
        <Card variant="default" className="space-y-5 text-right">
          <CardHeader className="pb-3">
            <CardTitle>
              <Clock className="w-4 h-4 text-purple-400" />
              <span>دقة احتساب وقت الخروج والمدة (Exit Tracker)</span>
            </CardTitle>
          </CardHeader>

          {/* Inactivity Exit Window */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-300">
              مهلة التحقق من مغادرة البث (Exit Timeout)
            </label>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              إذا لم يرسل المشاهد أي نشاط جديد (تفاعل، رسالة، أو بقاء) خلال هذه المدة، يقوم النظام باحتساب وقت خروجه الدقيق وإعادة حالته إلى "قيد المراقبة":
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { sec: 30, label: "30 ثانية (فوري فائق السرعة)" },
                { sec: 60, label: "60 ثانية (الافتراضي المتوازن)" },
                { sec: 90, label: "90 ثانية (دقيق)" },
                { sec: 120, label: "دقيقتان (بثوث هادئة)" },
              ].map((opt) => (
                <button
                  key={opt.sec}
                  type="button"
                  onClick={() => setInactivityTimeout(opt.sec)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-right ${
                    inactivityTimeout === opt.sec
                      ? "bg-purple-500/10 text-purple-300 border-purple-500/40"
                      : "bg-[#12141e] text-zinc-400 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-tiktok-cyan" />
                <span>مفتاح توقيع البث (EulerStream Sign API Key):</span>
              </label>
              <Input
                value={signApiKey}
                onChange={(e) => setSignApiKey(e.target.value)}
                placeholder="أدخل Sign API Key إن وجد (اختياري)..."
                dir="ltr"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#10121a] border border-zinc-800 space-y-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2 font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>دقة زمنية متناهية بالثواني</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              يقوم متتبع الجلسات بحساب لحظة المغادرة الفعلية اعتماداً على آخر نبضة حضور مسجلة في الغرفة، مما يضمن دقة 100% في سجل الأحداث ومدة المشاهدة.
            </p>
          </div>
        </Card>
      </div>

      {/* System Audit Logs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-tiktok-cyan" />
            <h2 className="text-lg font-bold text-white">سجلات الرقابة والعمليات اللحظية (System Logs)</h2>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value)}
              className="bg-[#161823] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none font-bold"
            >
              <option value="ALL">جميع المستويات</option>
              <option value="AUDIT">AUDIT (تدقيق)</option>
              <option value="INFO">INFO (معلومات)</option>
              <option value="WARN">WARN (تحذيرات)</option>
              <option value="ERROR">ERROR (أخطاء)</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              loading={loadingLogs}
              className="text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#10121a] p-4 overflow-x-auto max-h-[360px] overflow-y-auto font-mono text-xs text-zinc-300 space-y-2 text-left" dir="ltr">
          {logs.length === 0 ? (
            <p className="text-zinc-500 text-center py-6">No logs recorded yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-1 border-b border-zinc-900/80">
                <span className="text-zinc-500 whitespace-nowrap">{formatDate(log.createdAt)}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    log.level === "AUDIT"
                      ? "bg-tiktok-cyan/10 text-tiktok-cyan"
                      : log.level === "WARN"
                      ? "bg-amber-500/10 text-amber-400"
                      : log.level === "ERROR"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-purple-400 whitespace-nowrap">[{log.category}]</span>
                <span className="text-zinc-200 flex-1">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
