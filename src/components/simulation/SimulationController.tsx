"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PlayCircle, Sparkles, Zap, Users } from "lucide-react";
import { MonitoredAccountDTO, TargetHostDTO } from "@/types";

interface SimulationControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUsername?: string;
  defaultHost?: string;
}

export function SimulationControllerModal({
  isOpen,
  onClose,
  defaultUsername = "",
  defaultHost = "",
}: SimulationControllerModalProps) {
  const [accounts, setAccounts] = useState<MonitoredAccountDTO[]>([]);
  const [hosts, setHosts] = useState<TargetHostDTO[]>([]);
  const [username, setUsername] = useState(defaultUsername);
  const [hostUsername, setHostUsername] = useState(defaultHost);
  const [liveTitle, setLiveTitle] = useState("🔥 بث مباشر استثنائي على تيك توك");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/accounts")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data.length > 0) {
            setAccounts(d.data);
            if (!username) {
              setUsername(defaultUsername || d.data[0]?.username || "");
            }
          }
        })
        .catch(() => {});

      fetch("/api/hosts")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data.length > 0) {
            setHosts(d.data);
            if (!hostUsername) {
              setHostUsername(defaultHost || d.data[0]?.hostUsername || "streamer_live");
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, defaultUsername, defaultHost, username, hostUsername]);

  const handleTrigger = async (u?: string, h?: string, t?: string) => {
    const targetUser = (u || username).trim();
    const targetHost = (h || hostUsername || "streamer_live").trim();
    const title = (t || liveTitle).trim();

    if (!targetUser) {
      setError("يرجى اختيار أو إدخال اسم مستخدم المشاهد.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: targetUser,
          hostUsername: targetHost,
          liveTitle: title,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "فشلت عملية المحاكاة");
      }

      setSuccessMsg(`تم إرسال التنبيه! راقب شريط التنبيهات في الأعلى واستمع للنغمة.`);
      setTimeout(() => {
        onClose();
        setSuccessMsg("");
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-white">
          <Zap className="w-5 h-5 text-tiktok-cyan animate-pulse" />
          <span>تجربة محاكاة رصد البث المباشر</span>
        </div>
      }
      description="اختبار فوري لنظام التنبيهات الصوتية والمرئية دون إضافة أي حسابات تلقائياً إلى قاعدة بياناتك."
      maxWidth="md"
    >
      <div className="space-y-5 text-right">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Existing Accounts quick picker */}
        {accounts.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-tiktok-cyan" />
              <span>اختر من حساباتك المراقبة الحالية:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setUsername(acc.username)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-right flex items-center justify-between ${
                    username === acc.username
                      ? "bg-tiktok-cyan/10 text-tiktok-cyan border-tiktok-cyan/40 shadow-sm"
                      : "bg-[#12141e] text-zinc-300 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <span className="truncate font-mono" dir="ltr">@{acc.username}</span>
                  {username === acc.username && <span className="text-tiktok-cyan">●</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom trigger fields */}
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <Input
            label="اسم المستخدم المشاهد (المراقب)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="مثال: target_user"
            dir="ltr"
            required
          />

          <Input
            label="اسم المستخدم صاحب البث (المضيف)"
            value={hostUsername}
            onChange={(e) => setHostUsername(e.target.value)}
            placeholder="مثال: live_host"
            dir="ltr"
          />

          <Input
            label="عنوان البث المباشر"
            value={liveTitle}
            onChange={(e) => setLiveTitle(e.target.value)}
            placeholder="مثال: بث المناقشات المباشرة"
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
          <Button variant="ghost" size="md" type="button" onClick={onClose}>
            إلغاء
          </Button>

          <Button
            variant="cyan"
            size="md"
            onClick={() => handleTrigger()}
            loading={loading}
            className="gap-2 font-bold shadow-tiktok-cyan/30"
          >
            <PlayCircle className="w-4 h-4" />
            <span>إطلاق التنبيه التجريبي</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
