"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Tv,
  History,
  FlaskConical,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  {
    label: "لوحة التحكم",
    href: "/",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "الحسابات المراقبة",
    href: "/accounts",
    icon: Users,
    badge: "قائمة الرصد",
  },
  {
    label: "قنوات البث المستهدفة",
    href: "/hosts",
    icon: Tv,
    badge: null,
  },
  {
    label: "سجل النشاطات",
    href: "/history",
    icon: History,
    badge: null,
  },
  {
    label: "المحاكاة والاختبار",
    href: "/simulation",
    icon: FlaskConical,
    badge: "تجريبي",
  },
  {
    label: "الإعدادات والسجلات",
    href: "/settings",
    icon: Settings,
    badge: null,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-16 bottom-0 right-0 z-40 w-64 border-l border-zinc-800/80 bg-[#0f1015] flex flex-col justify-between p-4 transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}
      >
        <div className="space-y-6">
          <div className="px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              نظام الرصد المباشر
            </p>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    isActive
                      ? "bg-zinc-800/90 text-white font-semibold shadow-inner border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive ? "text-tiktok-cyan" : "text-zinc-400 group-hover:text-zinc-200"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        item.badge === "تجريبي"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-tiktok-cyan/10 text-tiktok-cyan border border-tiktok-cyan/20"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom security badge / status */}
        <div className="space-y-3 pt-4 border-t border-zinc-800/60">
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>محرك الرصد اللحظي</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              متصل ببروتوكول Webcast لرصد حزم دخول المشاهدين إلى غرف البث.
            </p>
          </div>

          <div className="flex items-center justify-between px-2 text-[11px] text-zinc-500">
            <span>الإصدار 1.0 Enterprise</span>
            <span className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200">
              بث SSE <span className="text-emerald-400">●</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
