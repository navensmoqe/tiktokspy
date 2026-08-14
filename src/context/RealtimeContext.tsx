"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { LiveEventDTO, MonitoredAccountDTO, NotificationDTO, RealtimeEventPayload } from "@/types";
import { audioAlert } from "@/components/ui/AudioAlertController";
import { BrowserNotificationHelper } from "@/components/ui/BrowserNotificationHelper";

interface RealtimeContextType {
  isConnected: boolean;
  activeAlert: LiveEventDTO | null;
  dismissAlert: () => void;
  notifications: NotificationDTO[];
  unreadCount: number;
  markAllNotificationsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  triggerSoundTest: (type: "chime" | "radar" | "alarm" | "subtle") => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeAlert, setActiveAlert] = useState<LiveEventDTO | null>(null);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenEventIds = useRef(new Set<string>());

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
        setUnreadCount(json.unreadCount);
      }
    } catch (error) {
      console.warn("Error loading notifications:", error);
    }
  }, []);

  const handleLiveEvent = useCallback((event: LiveEventDTO) => {
    if (seenEventIds.current.has(event.id)) return;
    seenEventIds.current.add(event.id);
    setActiveAlert(event);
    audioAlert.playSound("radar", 80);
    BrowserNotificationHelper.send("TikTok LIVE activity detected", {
      body: `@${event.monitoredUsername} joined @${event.hostUsername}'s LIVE`,
      url: event.liveUrl || `https://www.tiktok.com/@${event.hostUsername}/live`,
      tag: `live-${event.id}`,
    });
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    const connect = () => {
      eventSource = new EventSource("/api/realtime");
      eventSource.onopen = () => setIsConnected(true);
      eventSource.onmessage = (message) => {
        try {
          const payload: RealtimeEventPayload = JSON.parse(message.data);
          if (payload.type === "LIVE_DETECTED" && payload.data.event) handleLiveEvent(payload.data.event);
        } catch {}
      };
      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };
    connect();
    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [handleLiveEvent]);

  // The Railway worker and Vercel run in different processes. Poll the shared
  // Supabase-backed API so an event written by the worker reaches this UI.
  useEffect(() => {
    let cancelled = false;
    const pollLatestEvent = async (seedOnly = false) => {
      try {
        const response = await fetch("/api/events?limit=1", { cache: "no-store" });
        const json = await response.json();
        const event = json.success ? (json.data?.[0] as LiveEventDTO | undefined) : undefined;
        if (!event || cancelled) return;
        if (seedOnly) seenEventIds.current.add(event.id);
        else handleLiveEvent(event);
      } catch {}
    };
    pollLatestEvent(true);
    const interval = setInterval(() => pollLatestEvent(), 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [handleLiveEvent]);

  const dismissAlert = useCallback(() => setActiveAlert(null), []);
  const markAllNotificationsRead = useCallback(async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setUnreadCount(0);
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
  }, []);
  const triggerSoundTest = useCallback((type: "chime" | "radar" | "alarm" | "subtle") => audioAlert.playSound(type, 80), []);

  return <RealtimeContext.Provider value={{ isConnected, activeAlert, dismissAlert, notifications, unreadCount, markAllNotificationsRead, refreshNotifications: fetchNotifications, triggerSoundTest }}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtime must be used within RealtimeProvider");
  return context;
}
