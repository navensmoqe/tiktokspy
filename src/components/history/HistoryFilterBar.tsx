"use client";

import React from "react";
import { Search, Download, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface HistoryFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  source: string;
  onSourceChange: (val: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  loading?: boolean;
}

export function HistoryFilterBar({
  search,
  onSearchChange,
  source,
  onSourceChange,
  onRefresh,
  onExport,
  loading,
}: HistoryFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#161823]/80 border border-zinc-800/80 mb-6 text-right">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="البحث باسم المشاهد، المضيف، أو عنوان البث..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            prefixElement={<Search className="w-4 h-4" />}
            className="bg-[#10121a]"
          />
        </div>

        <select
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          className="bg-[#10121a] border border-zinc-700/60 rounded-xl px-3 py-2 text-xs font-bold text-zinc-200 focus:outline-none focus:border-tiktok-cyan"
        >
          <option value="ALL">جميع المصادر</option>
          <option value="WEBCAST_ROOM">سوكت Webcast المباشر</option>
          <option value="SIMULATION">معمل المحاكاة</option>
          <option value="API_RELAY">مرحل API</option>
        </select>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          loading={loading}
          className="text-xs font-bold"
          title="تحديث البيانات"
        >
          <RefreshCw className="w-3.5 h-3.5 ml-1" />
          <span>تحديث</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onExport}
          className="text-xs text-tiktok-cyan border-tiktok-cyan/30 hover:bg-tiktok-cyan/10 font-bold"
        >
          <Download className="w-3.5 h-3.5 ml-1" />
          <span>تصدير تقرير CSV</span>
        </Button>
      </div>
    </div>
  );
}
