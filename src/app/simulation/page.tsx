"use client";

import React, { useState } from "react";
import {
  FlaskConical,
  PlayCircle,
  Zap,
  Volume2,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { audioAlert } from "@/components/ui/AudioAlertController";
import { BrowserNotificationHelper } from "@/components/ui/BrowserNotificationHelper";

const PRESETS = [
  {
    viewer: "sarah_travels",
    host: "mr_beast_live",
    title: "🎁 بث مباشر وتحديات جوائز $100,000!",
    desc: "محاكاة دخول مشاهد إلى بث مباشر ذو كثافة عالية.",
  },
  {
    viewer: "alex_gaming",
    host: "ninja_stream",
    title: "🎮 مباريات تصنيف ولعب جماعي مباشر",
    desc: "محاكاة دخول مشاهد إلى بث ألعاب إلكترونية.",
  },
  {
    viewer: "tech_guru",
    host: "elon_insights",
    title: "🚀 حوار مباشر حول الذكاء الاصطناعي والتقنية",
    desc: "محاكاة دخول مشاهد إلى بث تقني مباشر.",
  },
  {
    viewer: "lisa_dance",
    host: "tiktok_music_live",
    title: "🎵 حفل موسيقي مباشر وعزف حي",
    desc: "محاكاة دخول مشاهد إلى بث مباشر موسيقي.",
  },
];

export default function SimulationPage() {
  const [viewer, setViewer] = useState("sarah_travels");
  const [host, setHost] = useState("mr_beast_live");
  const [title, setTitle] = useState("🔥 بث مباشر استثنائي على تيك توك");
  const [loading, setLoading] = useState(false);
  const [lastDispatched, setLastDispatched] = useState<string | null>(null);

  const handleTrigger = async (v?: string, h?: string, t?: string) => {
    const targetViewer = (v || viewer).trim();
    const targetHost = (h || host).trim();
    const liveTitle = (t || title).trim();

    setLoading(true);
    setLastDispatched(null);

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: targetViewer,
          hostUsername: targetHost,
          liveTitle,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setLastDispatched(`تم الإرسال: @${targetViewer} دخل الآن بث @${targetHost}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-right">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <FlaskConical className="w-7 h-7 text-purple-400" />
          <span>استوديو محاكاة واختبار الرصد اللحظي</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          بيئة تجارب لتوليد أحداث دخول افتراضية واختبار استجابة التنبيهات الصوتية وإشعارات المتصفح.
        </p>
      </div>

      {lastDispatched && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-3 animate-slide-down">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{lastDispatched} (شاهد شريط التنبيهات العلوي واستمع للنغمة!)</span>
        </div>
      )}

      {/* Preset Scenarios Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-tiktok-cyan" />
          <span>سيناريوهات جاهزة بضغطة زر</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESETS.map((p, i) => (
            <Card key={i} variant="default" className="p-5 hover:border-zinc-700 transition-all flex flex-col justify-between text-right">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-tiktok-cyan font-mono" dir="ltr">@{p.viewer}</span>
                  <span className="text-xs text-zinc-500">إلى</span>
                  <span className="text-xs font-bold text-tiktok-red font-mono" dir="ltr">@{p.host}</span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{p.title}</h4>
                <p className="text-xs text-zinc-400">{p.desc}</p>
              </div>

              <div className="pt-4 mt-3 border-t border-zinc-800 flex justify-end">
                <Button
                  variant="cyan"
                  size="sm"
                  onClick={() => handleTrigger(p.viewer, p.host, p.title)}
                  loading={loading}
                  className="font-bold gap-1.5"
                >
                  <PlayCircle className="w-4 h-4 ml-1" />
                  <span>إطلاق التنبيه</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Event Trigger Form & Audio Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Custom Form */}
        <Card variant="elevated" className="space-y-4 text-right">
          <CardHeader className="pb-3">
            <CardTitle>
              <Zap className="w-4 h-4 text-tiktok-cyan" />
              <span>توليد حدث دخول مخصص</span>
            </CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <Input
              label="اسم المشاهد (المراقب)"
              value={viewer}
              onChange={(e) => setViewer(e.target.value)}
              placeholder="مثال: target_user"
              dir="ltr"
            />

            <Input
              label="اسم صاحب البث (المضيف)"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="مثال: host_user"
              dir="ltr"
            />

            <Input
              label="عنوان البث المباشر"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: بث المناقشات المباشرة"
            />

            <Button
              variant="primary"
              size="lg"
              onClick={() => handleTrigger()}
              loading={loading}
              className="w-full gap-2 font-bold shadow-tiktok-red/40"
            >
              <PlayCircle className="w-5 h-5 ml-1" />
              <span>إرسال حدث الرصد التجريبي</span>
            </Button>
          </div>
        </Card>

        {/* Audio & Alert Sound Workbench */}
        <Card variant="default" className="space-y-4 text-right">
          <CardHeader className="pb-3">
            <CardTitle>
              <Volume2 className="w-4 h-4 text-tiktok-cyan" />
              <span>لوحة اختبار النغمات الصوتية والإشعارات</span>
            </CardTitle>
          </CardHeader>

          <p className="text-xs text-zinc-400">
            اختبار نغمات التنبيه المولدة فورياً عبر Web Audio API دون الحاجة لتحميل ملفات صوتية:
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { type: "radar", name: "مسح الرادار (الافتراضي)" },
              { type: "chime", name: "رنين نغمي (Chime)" },
              { type: "alarm", name: "إنذار طوارئ (Alarm)" },
              { type: "subtle", name: "نبضة هادئة (Subtle)" },
            ].map((s) => (
              <Button
                key={s.type}
                variant="secondary"
                size="md"
                onClick={() => audioAlert.playSound(s.type as any, 85)}
                className="justify-start text-xs font-bold gap-2 border-zinc-700"
              >
                <Volume2 className="w-4 h-4 text-tiktok-cyan ml-1" />
                <span>{s.name}</span>
              </Button>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>اختبار إشعارات الهاتف وجوجل كروم (Chrome Mobile Push)</span>
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              إرسال إشعار فوري مباشر إلى شاشة هاتفك مع اهتزاز الجهاز ونغمة التنبيه عبر متصفح Google Chrome:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="cyan"
                size="sm"
                onClick={async () => {
                  await BrowserNotificationHelper.send("🔴 تنبيه مباشر: حسابك دخل البث الآن!", {
                    body: "المستخدم @sumer22085 دخل بث مباشر على تيك توك 📲",
                    url: "https://www.tiktok.com",
                  });
                }}
                className="text-xs font-bold gap-1.5 shadow-tiktok-cyan/20"
              >
                <Bell className="w-3.5 h-3.5 ml-1" />
                <span>إرسال إشعار فوري لهاتفي الآن</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
