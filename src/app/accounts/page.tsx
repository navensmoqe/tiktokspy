"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Search, RefreshCw } from "lucide-react";
import { MonitoredAccountDTO } from "@/types";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AddAccountForm } from "@/components/accounts/AddAccountForm";
import { SimulationControllerModal } from "@/components/simulation/SimulationController";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<MonitoredAccountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simUsername, setSimUsername] = useState("sarah_travels");

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/accounts");
      const json = await res.json();
      if (json.success) {
        setAccounts(json.data);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: active,
          status: active ? "MONITORING" : "IDLE",
        }),
      });
      fetchAccounts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      fetchAccounts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (confirm("هل تريد مسح جميع الحسابات المراقبة والبدء بقائمة فارغة تماماً؟")) {
      try {
        await fetch("/api/accounts", { method: "DELETE" });
        fetchAccounts();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.username.toLowerCase().includes(search.toLowerCase()) ||
      (acc.nickname && acc.nickname.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === "LIVE_DETECTED") return acc.status === "LIVE_DETECTED";
    if (statusFilter === "MONITORING") return acc.status === "MONITORING" && acc.isActive;
    if (statusFilter === "PAUSED") return !acc.isActive;

    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-tiktok-cyan" />
            <span>الحسابات المراقبة (قائمة الرصد)</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            إدارة حسابات تيك توك المستهدفة لرصد لحظة دخولها كمشاهدين إلى أي بث مباشر فورياً.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {accounts.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearAll}
              className="text-xs font-bold"
              title="مسح جميع الحسابات"
            >
              مسح كل الحسابات
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAccounts}
            loading={loading}
            className="text-xs text-zinc-400 font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5 ml-1" />
            <span>تحديث</span>
          </Button>
        </div>
      </div>

      {/* Top Add Form */}
      <AddAccountForm onAccountAdded={fetchAccounts} />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#161823]/80 border border-zinc-800/80">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="البحث باسم المستخدم أو اللقب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefixElement={<Search className="w-4 h-4" />}
            className="bg-[#10121a]"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: `الكل (${accounts.length})` },
            {
              id: "LIVE_DETECTED",
              label: `🔴 في بث مباشر (${accounts.filter((a) => a.status === "LIVE_DETECTED").length})`,
            },
            {
              id: "MONITORING",
              label: `🟢 قيد الرصد النشط (${accounts.filter((a) => a.isActive && a.status === "MONITORING").length})`,
            },
            {
              id: "PAUSED",
              label: `⚪ موقوف مؤقتاً (${accounts.filter((a) => !a.isActive).length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Accounts */}
      {filteredAccounts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#161823]/80 border border-dashed border-zinc-800 text-zinc-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <h4 className="text-base font-bold text-zinc-300">لا توجد حسابات مطابقة</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            حاول تغيير كلمات البحث أو تغيير تبويب الحالة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              onSimulate={(u) => {
                setSimUsername(u);
                setIsSimModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <SimulationControllerModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        defaultUsername={simUsername}
      />
    </div>
  );
}
