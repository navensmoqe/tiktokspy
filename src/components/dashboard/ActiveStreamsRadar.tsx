"use client";

import React from "react";
import { Radio, Tv, ExternalLink, Plus } from "lucide-react";
import { TargetHostDTO } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface ActiveStreamsRadarProps {
  hosts: TargetHostDTO[];
  onAddHostClick: () => void;
}

export function ActiveStreamsRadar({ hosts, onAddHostClick }: ActiveStreamsRadarProps) {
  const activeHosts = hosts.filter((h) => h.isActive);

  return (
    <Card variant="default" className="relative overflow-hidden flex flex-col justify-between text-right">
      <div>
        <CardHeader className="flex items-center justify-between pb-3">
          <CardTitle>
            <div className="p-1.5 rounded-lg bg-tiktok-cyan/10 text-tiktok-cyan border border-tiktok-cyan/20">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <span>رادار قنوات البث النشطة</span>
          </CardTitle>

          <Button
            variant="ghost"
            size="sm"
            onClick={onAddHostClick}
            className="text-xs text-tiktok-cyan hover:bg-tiktok-cyan/10 font-bold"
          >
            <Plus className="w-3.5 h-3.5 ml-1" />
            <span>إضافة قناة</span>
          </Button>
        </CardHeader>

        {/* Stream Radar Radar effect banner */}
        <div className="relative h-28 rounded-xl bg-gradient-to-l from-[#11131c] via-[#161928] to-[#11131c] border border-zinc-800/80 p-4 mb-4 flex items-center justify-between overflow-hidden">
          {/* Animated radar sweep line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-48 h-48 rounded-full border border-tiktok-cyan/50 animate-ping" />
            <div className="absolute w-32 h-32 rounded-full border border-tiktok-cyan/60" />
            <div className="absolute w-16 h-16 rounded-full border border-tiktok-cyan" />
          </div>

          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase">
                بروتوكول Webcast متصل
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-medium">
              فحص فوري لحزم دخول المشاهدين <code className="text-tiktok-cyan font-mono text-[11px]" dir="ltr">WebcastMemberMessage</code>
            </p>
          </div>

          <div className="relative z-10 text-left">
            <span className="text-2xl font-black text-white font-mono">{activeHosts.length}</span>
            <p className="text-[11px] text-zinc-400">قنوات مراقبة</p>
          </div>
        </div>

        {/* Target Hosts list */}
        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pl-1">
          {activeHosts.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800">
              <Tv className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
              <p className="text-xs font-medium text-zinc-400">لا توجد قنوات بث مستهدفة حالياً</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                أضف حسابات أصحاب البث للبدء في رصد دخول المشاهدين لحساباتهم.
              </p>
            </div>
          ) : (
            activeHosts.slice(0, 5).map((host) => (
              <div
                key={host.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#12141e] border border-zinc-800/80 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 overflow-hidden border border-zinc-700 font-mono">
                    {host.avatarUrl ? (
                      <img src={host.avatarUrl} alt={host.hostUsername} className="w-full h-full object-cover" />
                    ) : (
                      host.hostUsername.substring(0, 2).toUpperCase()
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white font-mono" dir="ltr">@{host.hostUsername}</span>
                      {host.isLive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-tiktok-red text-white uppercase">
                          مباشر الآن
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {host.currentTitle || "مستمع نشط للغرفة"}
                    </p>
                  </div>
                </div>

                <a
                  href={`https://www.tiktok.com/@${host.hostUsername}/live`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-tiktok-cyan hover:bg-zinc-800 transition-colors"
                  title="فتح البث المباشر"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-4 mt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
        <Link href="/hosts" className="text-tiktok-cyan hover:underline font-bold">
          عرض جميع القنوات ({hosts.length}) ←
        </Link>
        <span className="text-zinc-500 text-[11px]">مزامنة فورية</span>
      </div>
    </Card>
  );
}
