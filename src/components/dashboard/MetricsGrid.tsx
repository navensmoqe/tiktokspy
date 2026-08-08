"use client";

import React from "react";
import { Users, Radio, Tv, Flame, ArrowUpLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

interface MetricsGridProps {
  totalAccounts: number;
  activeMonitoringCount: number;
  liveDetectedCount: number;
  totalHosts: number;
  activeHostsCount: number;
  todayEventsCount: number;
}

export function MetricsGrid({
  totalAccounts,
  activeMonitoringCount,
  liveDetectedCount,
  totalHosts,
  activeHostsCount,
  todayEventsCount,
}: MetricsGridProps) {
  const cards = [
    {
      title: "الحسابات المراقبة",
      value: totalAccounts,
      subtext: `${activeMonitoringCount} قيد الرصد النشط`,
      icon: Users,
      color: "text-tiktok-cyan",
      bgColor: "bg-tiktok-cyan/10",
      borderColor: "border-tiktok-cyan/20",
      href: "/accounts",
    },
    {
      title: "في بث مباشر الآن",
      value: liveDetectedCount,
      subtext: liveDetectedCount > 0 ? "نشط الآن داخل البث المباشر" : "مسح دوري للغرف...",
      icon: Radio,
      color: "text-tiktok-red",
      bgColor: "bg-tiktok-red/10",
      borderColor: "border-tiktok-red/30",
      pulse: liveDetectedCount > 0,
      href: "/accounts?filter=LIVE_DETECTED",
    },
    {
      title: "قنوات البث المستهدفة",
      value: totalHosts,
      subtext: `${activeHostsCount} قناة متصلة بالرادار`,
      icon: Tv,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      href: "/hosts",
    },
    {
      title: "إجمالي رصد اليوم",
      value: todayEventsCount,
      subtext: "عمليات دخول تم توثيقها",
      icon: Flame,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      href: "/history",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Link key={i} href={c.href}>
            <Card
              variant="default"
              className={`p-4 hover:border-zinc-700 hover:scale-[1.01] transition-all cursor-pointer border ${c.borderColor} relative overflow-hidden group text-right`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {c.title}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                      {c.value}
                    </span>
                    {c.pulse && (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tiktok-red opacity-80" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tiktok-red" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">{c.subtext}</p>
                </div>

                <div
                  className={`p-3 rounded-xl ${c.bgColor} ${c.color} border border-white/5 transition-transform group-hover:-rotate-6`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500">
                <ArrowUpLeft className="w-4 h-4" />
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
