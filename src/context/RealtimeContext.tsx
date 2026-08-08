"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  LiveEventDTO,
  MonitoredAccountDTO,
  NotificationDTO,
  RealtimeEventPayload,
} from "@/types";
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

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
        setUnreadCount(json.unreadCount);
      }
    } catch (e) {
      console.warn("Error loading notifications:", e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Connect to Server-Sent Events stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      eventSource = new EventSource("/api/realtime");

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const payload: RealtimeEventPayload = JSON.parse(e.data);

          if (payload.type === "LIVE_DETECTED" && payload.data.event) {
            const ev = payload.data.event;
            setActiveAlert(ev);

            // Play synthesized audio chime
            audioAlert.playSound("radar", 80);

            // Send Chrome Mobile & Desktop push notification
            BrowserNotificationHelper.send(`🔴 تم رصد نشاط مباشر (تيك توك)`, {
              body: `المستخدم @${ev.monitoredUsername} دخل الآن بث مباشر للمضيف @${ev.hostUsername}`,
              url: ev.liveUrl || `https://www.tiktok.com/@${ev.hostUsername}/live`,
              tag: `live-${ev.id}`,
            });

            // Refresh notifications list
            fetchNotifications();
          }
        } catch {}
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        // Attempt reconnection after 3 seconds
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [fetchNotifications]);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.warn("Failed to mark notifications read:", e);
    }
  }, []);

  const triggerSoundTest = useCallback((type: "chime" | "radar" | "alarm" | "subtle") => {
    audioAlert.playSound(type, 80);
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        activeAlert,
        dismissAlert,
        notifications,
        unreadCount,
        markAllNotificationsRead,
        refreshNotifications: fetchNotifications,
        triggerSoundTest,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return ctx;
}
