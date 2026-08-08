"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tv, Plus, Search, RefreshCw, Radio } from "lucide-react";
import { TargetHostDTO } from "@/types";
import { HostCard } from "@/components/hosts/HostCard";
import { AddHostModal } from "@/components/hosts/AddHostModal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function HostsPage() {
  const [hosts, setHosts] = useState<TargetHostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddHostOpen, setIsAddHostOpen] = useState(false);

  const fetchHosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hosts?t=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setHosts(json.data);
      }
    } catch (err) {
      console.error("Error fetching hosts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHosts();
  }, [fetchHosts]);

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/hosts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      });
      fetchHosts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/hosts/${id}`, { method: "DELETE" });
      fetchHosts();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredHosts = hosts.filter((h) =>
    h.hostUsername.toLowerCase().includes(search.toLowerCase()) ||
    (h.nickname && h.nickname.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Tv className="w-7 h-7 text-purple-400" />
            <span>قنوات البث المستهدفة (Streamers)</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            تسجيل قنوات أصحاب البث للاتصال بغرف البث المباشر الخاصة بهم ورصد دخول المشاهدين إليها.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchHosts}
            loading={loading}
            className="border border-zinc-800 text-zinc-400 hover:text-white font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="cyan"
            size="md"
            onClick={() => setIsAddHostOpen(true)}
            className="gap-2 font-bold shadow-tiktok-cyan/20"
          >
            <Plus className="w-4 h-4 ml-1" />
            <span>إضافة قناة جديدة</span>
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-start gap-3.5 text-xs text-purple-200">
        <Radio className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <p className="font-bold text-white text-sm">
            كيف تتم آلية رصد دخول المشاهدين إلى البث؟
          </p>
          <p className="text-zinc-300 leading-relaxed">
            يقوم تيك توك ببث رسائل انضمام المشاهدين (<code className="text-purple-300 font-mono" dir="ltr">WebcastMemberMessage</code>) إلى غرفة كل مضيف نشط. يقوم النظام بالاتصال بهذه الغرف في الخلفية ومطابقة أسماء المشاهدين المنضمين فورياً مع قائمة حساباتك المراقبة.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#161823]/80 border border-zinc-800/80">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="البحث باسم صاحب البث أو اسم القناة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefixElement={<Search className="w-4 h-4" />}
            className="bg-[#10121a]"
          />
        </div>
      </div>

      {/* Hosts Grid */}
      {filteredHosts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#161823]/80 border border-dashed border-zinc-800 text-zinc-500">
          <Tv className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <h4 className="text-base font-bold text-zinc-300">لا توجد قنوات بث مسجلة</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto mb-4">
            أضف قنوات البث للبدء في الاستماع لحزم دخول المشاهدين.
          </p>
          <Button variant="cyan" size="sm" onClick={() => setIsAddHostOpen(true)} className="font-bold">
            <Plus className="w-4 h-4 ml-1" />
            <span>تسجيل قناة الآن</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHosts.map((host) => (
            <HostCard
              key={host.id}
              host={host}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddHostModal
        isOpen={isAddHostOpen}
        onClose={() => setIsAddHostOpen(false)}
        onSuccess={fetchHosts}
      />
    </div>
  );
}
