"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { LiveAlertBanner } from "@/components/dashboard/LiveAlertBanner";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import { SimulationControllerModal } from "@/components/simulation/SimulationController";
import { useRealtime } from "@/context/RealtimeContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    isConnected,
    activeAlert,
    dismissAlert,
    notifications,
    unreadCount,
    markAllNotificationsRead,
  } = useRealtime();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1015] text-zinc-100 font-sans" dir="rtl">
      <Navbar
        isConnected={isConnected}
        unreadNotifsCount={unreadCount}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onOpenSimulationModal={() => setIsSimModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 md:pr-64 min-w-0 flex flex-col">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
            {/* Global Real-time Live Alert Banner */}
            <LiveAlertBanner alert={activeAlert} onDismiss={dismissAlert} />

            {children}
          </div>
        </main>
      </div>

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={markAllNotificationsRead}
      />

      <SimulationControllerModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
      />
    </div>
  );
}
