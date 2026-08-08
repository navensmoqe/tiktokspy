"use client";

import React, { useState, useEffect, useCallback } from "react";
import { History as HistoryIcon, Download } from "lucide-react";
import { LiveEventDTO } from "@/types";
import { HistoryFilterBar } from "@/components/history/HistoryFilterBar";
import { HistoryTable } from "@/components/history/HistoryTable";
import { EventDetailModal } from "@/components/history/EventDetailModal";
import { Button } from "@/components/ui/Button";

export default function HistoryPage() {
  const [events, setEvents] = useState<LiveEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<LiveEventDTO | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (source && source !== "ALL") params.set("source", source);
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/events?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data);
        setPage(json.pagination.page);
        setTotalPages(json.pagination.totalPages);
        setTotal(json.pagination.total);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  }, [search, source, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleExportCSV = () => {
    window.open(`/api/events/export${search ? `?username=${encodeURIComponent(search)}` : ""}`, "_blank");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <HistoryIcon className="w-7 h-7 text-tiktok-cyan" />
            <span>سجل النشاطات والأحداث المرصودة</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            أرشيف زمني كامل ومفصل لجميع أحداث دخول المشاهدين إلى البث المباشر.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={handleExportCSV}
          className="gap-2 text-tiktok-cyan border-tiktok-cyan/30 hover:bg-tiktok-cyan/10 font-bold self-start sm:self-auto"
        >
          <Download className="w-4 h-4 ml-1" />
          <span>تصدير تقرير CSV</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <HistoryFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        source={source}
        onSourceChange={(val) => {
          setSource(val);
          setPage(1);
        }}
        onRefresh={fetchEvents}
        onExport={handleExportCSV}
        loading={loading}
      />

      {/* Table */}
      <HistoryTable
        events={events}
        onSelectEvent={(ev) => setSelectedEvent(ev)}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={(p) => setPage(p)}
      />

      {/* Event Details Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
