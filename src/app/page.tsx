"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  PlayCircle,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  Radio,
} from "lucide-react";
import {
  MonitoredAccountDTO,
  TargetHostDTO,
  LiveEventDTO,
} from "@/types";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { ActiveStreamsRadar } from "@/components/dashboard/ActiveStreamsRadar";
import { RecentEventsTimeline } from "@/components/dashboard/RecentEventsTimeline";
import { AccountCard } from "@/components/accounts/AccountCard";
import { QuickAddAccountModal } from "@/components/dashboard/QuickAddAccountModal";
import { AddHostModal } from "@/components/hosts/AddHostModal";
import { SimulationControllerModal } from "@/components/simulation/SimulationController";
import { EventDetailModal } from "@/components/history/EventDetailModal";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<MonitoredAccountDTO[]>([]);
  const [hosts, setHosts] = useState<TargetHostDTO[]>([]);
  const [recentEvents, setRecentEvents] = useState<LiveEventDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddHostOpen, setIsAddHostOpen] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simTargetUsername, setSimTargetUsername] = useState("sarah_travels");
  const [selectedEvent, setSelectedEvent] = useState<LiveEventDTO | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [accRes, hostRes, eventRes] = await Promise.all([
        fetch(`/api/accounts?t=${Date.now()}`, { cache: "no-store", headers: { Pragma: "no-cache" } }),
        fetch(`/api/hosts?t=${Date.now()}`, { cache: "no-store", headers: { Pragma: "no-cache" } }),
        fetch(`/api/events?limit=10&t=${Date.now()}`, { cache: "no-store", headers: { Pragma: "no-cache" } }),
      ]);

      const [accJson, hostJson, eventJson] = await Promise.all([
        accRes.json(),
        hostRes.json(),
        eventRes.json(),
      ]);

      if (accJson.success && Array.isArray(accJson.data)) setAccounts(accJson.data);
      if (hostJson.success && Array.isArray(hostJson.data)) setHosts(hostJson.data);
      if (eventJson.success && Array.isArray(eventJson.data)) setRecentEvents(eventJson.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleToggleAccountActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: active,
          status: active ? "MONITORING" : "IDLE",
        }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const activeAccountsCount = accounts.filter((a) => a.isActive).length;
  const liveDetectedCount = accounts.filter((a) => a.status === "LIVE_DETECTED").length;
  const activeHostsCount = hosts.filter((h) => h.isActive).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-right">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>رادار رصد مشاهدي تيك توك لايف</span>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            محرك لحظي متطور لمراقبة حسابات تيك توك ورصد دخولها كمشاهدين إلى أي بث مباشر في الوقت الفعلي.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            loading={loading}
            className="border border-zinc-800 text-zinc-400 hover:text-white"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setSimTargetUsername(accounts[0]?.username || "sarah_travels");
              setIsSimModalOpen(true);
            }}
            className="gap-2 text-tiktok-cyan border-tiktok-cyan/30 hover:bg-tiktok-cyan/10 font-bold"
          >
            <PlayCircle className="w-4 h-4" />
            <span>تجربة محاكاة الرصد</span>
          </Button>

          <Button
            variant="cyan"
            size="md"
            onClick={() => setIsAddAccountOpen(true)}
            className="gap-2 font-bold shadow-tiktok-cyan/20"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حساب للمراقبة</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <MetricsGrid
        totalAccounts={accounts.length}
        activeMonitoringCount={activeAccountsCount}
        liveDetectedCount={liveDetectedCount}
        totalHosts={hosts.length}
        activeHostsCount={activeHostsCount}
        todayEventsCount={recentEvents.length}
      />

      {/* Real-time Instructions Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-l from-tiktok-cyan/10 via-[#161823] to-[#161823] border border-tiktok-cyan/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-tiktok-cyan/20 text-tiktok-cyan border border-tiktok-cyan/30 flex-shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>كيف ترصد دخولك إلى أي بث مباشر على تيك توك؟</span>
              <span className="text-[10px] bg-tiktok-cyan/20 text-tiktok-cyan px-2 py-0.5 rounded font-mono font-bold">خطوتين فقط</span>
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              <strong>1.</strong> تأكد أن حسابك مضاف في <strong>الحسابات المراقبة</strong> (مثل: <code className="text-tiktok-cyan font-mono" dir="ltr">@sumer22085</code>).<br />
              <strong>2.</strong> أضف اسم <strong>صاحب البث (المضيف)</strong> الذي تريد الدخول إليه في <strong>قنوات البث المستهدفة</strong> ليتصل الرادار بغرفته.<br />
              بمجرد دخولك البث من هاتفك، سيلتقط الرادار انضمامك ويطلق التنبيه الأحمر والصوت فورياً!
            </p>
          </div>
        </div>

        <Button
          variant="cyan"
          size="sm"
          onClick={() => setIsAddHostOpen(true)}
          className="font-bold flex-shrink-0"
        >
          <Plus className="w-4 h-4 ml-1" />
          <span>إضافة صاحب البث</span>
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Right 2 Columns (start in RTL): Monitored Accounts Watchlist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-tiktok-cyan" />
                <span>قائمة الحسابات المراقبة</span>
              </h2>
              <p className="text-xs text-zinc-400">
                الحسابات المحددة قيد الرصد المباشر لدخول البث
              </p>
            </div>

            <Link
              href="/accounts"
              className="text-xs font-bold text-tiktok-cyan hover:underline flex items-center gap-1"
            >
              <span>إدارة الكل ({accounts.length})</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {accounts.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-[#161823]/80 border border-dashed border-zinc-800 text-zinc-500">
              <Users className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
              <p className="text-sm font-bold text-zinc-300">لا توجد حسابات في قائمة المراقبة حتى الآن</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                أدخل اسم مستخدم تيك توك للبدء في تتبع نشاط دخوله للبث المباشر.
              </p>
              <Button
                variant="cyan"
                size="sm"
                onClick={() => setIsAddAccountOpen(true)}
                className="font-bold"
              >
                <Plus className="w-4 h-4 ml-1" />
                <span>إضافة أول حساب</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {accounts.slice(0, 4).map((acc) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  onToggleActive={handleToggleAccountActive}
                  onDelete={handleDeleteAccount}
                  onSimulate={(u) => {
                    setSimTargetUsername(u);
                    setIsSimModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {/* Architecture Note in Arabic */}
          <div className="p-4 rounded-2xl bg-[#12141d] border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-zinc-200">
                ملاحظة التوافق مع بروتوكول تيك توك الرسمي
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                يعمل نظام الرصد من خلال الاستماع لحزم غرف البث (Webcast Member Packets). عند دخول أي حساب من قائمة المراقبة إلى أي بث مباشر مسجل، يتم إطلاق التنبيهات الصوتية وإشعارات المتصفح في أجزاء من الثانية دون أي تأخير.
              </p>
            </div>
          </div>
        </div>

        {/* Left 1 Column: Stream Radar & Real-Time Feed */}
        <div className="space-y-6">
          <ActiveStreamsRadar
            hosts={hosts}
            onAddHostClick={() => setIsAddHostOpen(true)}
          />

          <RecentEventsTimeline
            events={recentEvents}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
          />
        </div>
      </div>

      {/* Modals */}
      <QuickAddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onSuccess={fetchData}
      />

      <AddHostModal
        isOpen={isAddHostOpen}
        onClose={() => setIsAddHostOpen(false)}
        onSuccess={fetchData}
      />

      <SimulationControllerModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        defaultUsername={simTargetUsername}
      />

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
