import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanUsername(username: string): string {
  if (!username) return "";
  return username.trim().replace(/^@+/, "").toLowerCase();
}

export function formatTikTokUrl(username: string, isLive: boolean = false): string {
  const clean = cleanUsername(username);
  if (!clean) return "https://www.tiktok.com";
  return isLive ? `https://www.tiktok.com/@${clean}/live` : `https://www.tiktok.com/@${clean}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "yyyy/MM/dd HH:mm:ss", { locale: ar });
  } catch {
    return "—";
  }
}

export function formatTimeOnly(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "HH:mm:ss");
  } catch {
    return "—";
  }
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "لم يتم بعد";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: ar });
  } catch {
    return "—";
  }
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "نشط الآن";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} ثانية`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours === 0) return `${mins} دقيقة و ${secs} ثانية`;
  return `${hours} ساعة و ${remMins} دقيقة`;
}
