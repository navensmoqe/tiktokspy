"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AtSign, Plus } from "lucide-react";

interface QuickAddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickAddAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: QuickAddAccountModalProps) {
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("يرجى إدخال اسم مستخدم تيك توك");
      return;
    }

    setLoading(true);
    setError("");

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

      setUsername("");
      setNickname("");
      onSuccess();
      onClose();
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
      title="إضافة حساب إلى قائمة المراقبة"
      description="أدخل اسم مستخدم تيك توك لبدء مراقبة دخوله إلى أي بث مباشر."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-right">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <Input
          label="اسم مستخدم تيك توك (Username)"
          placeholder="مثال: username أو @username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          prefixElement={<AtSign className="w-4 h-4" />}
          autoFocus
          dir="ltr"
          required
        />

        <Input
          label="اسم تعريفي / لقب (اختياري)"
          placeholder="مثال: عميل مهم أو المؤثر 1"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <div className="pt-2 flex items-center justify-end gap-2">
          <Button variant="ghost" size="md" type="button" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="cyan" size="md" type="submit" loading={loading} className="gap-2 font-bold">
            <Plus className="w-4 h-4" />
            <span>إضافة الحساب</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
