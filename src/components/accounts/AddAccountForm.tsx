"use client";

import React, { useState } from "react";
import { AtSign, Plus, UserPlus, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface AddAccountFormProps {
  onAccountAdded: () => void;
}

export function AddAccountForm({ onAccountAdded }: AddAccountFormProps) {
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("يرجى إدخال اسم مستخدم تيك توك");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          nickname: nickname.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "فشل في إضافة الحساب");
      }

      setSuccess(`تمت إضافة الحساب @${username.replace(/^@+/, "")} إلى قائمة الرصد النشط بنجاح.`);
      setUsername("");
      setNickname("");
      onAccountAdded();

      setTimeout(() => setSuccess(""), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-6 bg-[#161823]/90 border border-zinc-800/80 shadow-xl backdrop-blur-md text-right">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-tiktok-cyan/10 text-tiktok-cyan border border-tiktok-cyan/20">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">إضافة حساب للمراقبة</h3>
          <p className="text-xs text-zinc-400">
            أدخل حساب تيك توك لرصد لحظة دخوله كمشاهد لأي بث مباشر.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="مثال: username أو @username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            prefixElement={<AtSign className="w-4 h-4" />}
            label="اسم مستخدم تيك توك (Username)"
            dir="ltr"
            required
          />

          <Input
            placeholder="مثال: عميل VIP أو المؤثر الفلاني"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            label="اللقب / الاسم التعريفي (اختياري)"
          />
        </div>

        <div className="flex items-center justify-end pt-1">
          <Button
            type="submit"
            variant="cyan"
            size="md"
            loading={loading}
            className="gap-2 font-bold shadow-tiktok-cyan/30 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>بدء المراقبة والرصد</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
