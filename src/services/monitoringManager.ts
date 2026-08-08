import { db } from "@/lib/db";
import { logSystemEvent } from "@/lib/logger";
import { emitRealtimeEvent } from "@/lib/eventBus";
import { TiktokWebcastProvider } from "./providers/tiktokWebcastProvider";
import { SimulationProvider } from "./providers/simulationProvider";
import { ViewerJoinEvent } from "./providers/baseProvider";

declare global {
  // eslint-disable-next-line no-var
  var globalMonitoringManager: MonitoringManager | undefined;
}

export class MonitoringManager {
  private webcastProvider: TiktokWebcastProvider;
  private simulationProvider: SimulationProvider;
  private isInitialized = false;
  private pollerTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.webcastProvider = new TiktokWebcastProvider();
    this.simulationProvider = new SimulationProvider();
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    await logSystemEvent("INFO", "MONITOR", "Initializing MonitoringManager service...");
    await this.syncActiveHosts();

    // Start periodic background check & heartbeat
    if (!this.pollerTimer) {
      this.pollerTimer = setInterval(() => {
        this.runPeriodicCheck().catch((err) => {
          console.error("Error in monitoring periodic check:", err);
        });
      }, 15000);
    }
  }

  public async syncActiveHosts(): Promise<void> {
    try {
      const activeHosts = await db.targetHost.findMany({
        where: { isActive: true },
      });

      for (const host of activeHosts) {
        // Connect to simulation callback
        await this.simulationProvider.connectToHost(host.hostUsername, (event) => {
          this.handleViewerJoin(event).catch(console.error);
        });

        // Try connecting to live webcast stream
        this.webcastProvider
          .connectToHost(host.hostUsername, (event) => {
            this.handleViewerJoin(event).catch(console.error);
          })
          .catch((err) => {
            console.warn(`Webcast connection attempt for @${host.hostUsername}:`, err.message);
          });
      }

      await logSystemEvent("INFO", "MONITOR", `Synced ${activeHosts.length} active target host streams`);
    } catch (err) {
      console.error("Failed to sync active hosts:", err);
    }
  }

  public async registerHost(hostUsername: string): Promise<void> {
    const clean = hostUsername.replace(/^@+/, "").toLowerCase();
    await this.simulationProvider.connectToHost(clean, (event) => {
      this.handleViewerJoin(event).catch(console.error);
    });

    this.webcastProvider
      .connectToHost(clean, (event) => {
        this.handleViewerJoin(event).catch(console.error);
      })
      .catch((err) => {
        console.warn(`Could not connect webcast to @${clean}:`, err.message);
      });
  }

  public async unregisterHost(hostUsername: string): Promise<void> {
    const clean = hostUsername.replace(/^@+/, "").toLowerCase();
    await this.simulationProvider.disconnectFromHost(clean);
    await this.webcastProvider.disconnectFromHost(clean);
  }

  public async handleViewerJoin(event: ViewerJoinEvent, customSource?: string): Promise<void> {
    const cleanViewer = event.viewerUsername.replace(/^@+/, "").toLowerCase();
    const cleanHost = event.hostUsername.replace(/^@+/, "").toLowerCase();
    const source = customSource || (event.rawPayload?.simulated ? "SIMULATION" : "WEBCAST_ROOM");
    const now = new Date();

    // Check if viewer is in monitored accounts
    const account = await db.monitoredAccount.findFirst({
      where: {
        username: cleanViewer,
        isActive: true,
      },
    });

    if (!account) {
      // If simulated and user wants to test UI alert, dispatch SSE payload without altering the DB
      if (source === "SIMULATION") {
        emitRealtimeEvent({
          type: "LIVE_DETECTED",
          timestamp: now.toISOString(),
          data: {
            event: {
              id: "sim-" + Date.now(),
              monitoredAccountId: "demo",
              monitoredUsername: cleanViewer,
              hostUsername: cleanHost,
              liveTitle: event.liveTitle || `بث مباشر للمضيف @${cleanHost}`,
              liveUrl: event.liveUrl,
              detectedAt: now.toISOString(),
              detectionSource: "SIMULATION",
              createdAt: now.toISOString(),
              monitoredAccount: {
                nickname: event.viewerNickname || cleanViewer,
                avatarUrl: event.viewerAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanViewer}`,
              },
            },
            notification: {
              id: "sim-notif-" + Date.now(),
              title: `🔴 تم رصد نشاط مباشر (LIVE)`,
              message: `@${cleanViewer} دخل الآن بث مباشر للمضيف @${cleanHost}`,
              type: "LIVE_DETECTED",
              isRead: false,
              createdAt: now.toISOString(),
            },
          },
        });
      }
      return;
    }

    // 1. Update Monitored Account status
    const updatedAccount = await db.monitoredAccount.update({
      where: { id: account.id },
      data: {
        status: "LIVE_DETECTED",
        lastDetectedAt: now,
        lastCheckedAt: now,
        currentHost: cleanHost,
        currentLiveUrl: event.liveUrl,
        currentLiveTitle: event.liveTitle || `بث مباشر للمضيف @${cleanHost}`,
      },
    });

    // 2. Create LiveEvent record
    const liveEvent = await db.liveEvent.create({
      data: {
        monitoredAccountId: account.id,
        monitoredUsername: cleanViewer,
        hostUsername: cleanHost,
        liveTitle: event.liveTitle || `بث مباشر للمضيف @${cleanHost}`,
        liveUrl: event.liveUrl,
        detectedAt: now,
        detectionSource: source,
        metadataJson: JSON.stringify({
          viewerNickname: event.viewerNickname,
          viewerAvatar: event.viewerAvatar,
          viewerCount: event.viewerCount,
          raw: event.rawPayload,
        }),
      },
      include: {
        monitoredAccount: true,
      },
    });

    // 3. Create Notification
    const notifTitle = `🔴 تم رصد نشاط مباشر (LIVE)`;
    const notifMsg = `@${cleanViewer} دخل الآن بث مباشر للمضيف @${cleanHost}`;

    const notification = await db.notification.create({
      data: {
        liveEventId: liveEvent.id,
        title: notifTitle,
        message: notifMsg,
        type: "LIVE_DETECTED",
      },
    });

    // 4. Log Audit Event
    await logSystemEvent("AUDIT", "MONITOR", `LIVE Detected: @${cleanViewer} entered @${cleanHost}'s live room`, {
      eventId: liveEvent.id,
      liveUrl: event.liveUrl,
      source,
    });

    // 5. Emit Real-time SSE Dispatch
    emitRealtimeEvent({
      type: "LIVE_DETECTED",
      timestamp: now.toISOString(),
      data: {
        event: {
          id: liveEvent.id,
          monitoredAccountId: account.id,
          monitoredUsername: cleanViewer,
          hostUsername: cleanHost,
          liveTitle: liveEvent.liveTitle,
          liveUrl: liveEvent.liveUrl,
          detectedAt: liveEvent.detectedAt.toISOString(),
          detectionSource: source,
          createdAt: liveEvent.createdAt.toISOString(),
          monitoredAccount: {
            nickname: account.nickname,
            avatarUrl: account.avatarUrl,
          },
        },
        account: {
          id: updatedAccount.id,
          username: updatedAccount.username,
          status: updatedAccount.status as any,
          lastDetectedAt: updatedAccount.lastDetectedAt?.toISOString(),
          currentHost: updatedAccount.currentHost,
          currentLiveUrl: updatedAccount.currentLiveUrl,
          currentLiveTitle: updatedAccount.currentLiveTitle,
        },
        notification: {
          id: notification.id,
          liveEventId: notification.liveEventId,
          title: notification.title,
          message: notification.message,
          type: notification.type as any,
          isRead: notification.isRead,
          createdAt: notification.createdAt.toISOString(),
        },
      },
    });
  }

  public async triggerSimulatedEvent(
    viewerUsername: string,
    hostUsername: string,
    customTitle?: string
  ): Promise<void> {
    const cleanViewer = viewerUsername.replace(/^@+/, "").toLowerCase();
    const cleanHost = hostUsername.replace(/^@+/, "").toLowerCase();

    // Ensure virtual connection exists
    await this.simulationProvider.connectToHost(cleanHost, (event) => {
      this.handleViewerJoin(event, "SIMULATION").catch(console.error);
    });

    const event = this.simulationProvider.triggerSyntheticEvent(cleanViewer, cleanHost, customTitle);
    await this.handleViewerJoin(event, "SIMULATION");
  }

  private async runPeriodicCheck(): Promise<void> {
    const now = new Date();
    try {
      // Update lastCheckedAt on active accounts
      await db.monitoredAccount.updateMany({
        where: { isActive: true },
        data: { lastCheckedAt: now },
      });

      // Emit heartbeat to keep SSE connections healthy
      emitRealtimeEvent({
        type: "HEARTBEAT",
        timestamp: now.toISOString(),
        data: {
          message: "System health OK",
        },
      });
    } catch (err) {
      console.error("Heartbeat error:", err);
    }
  }
}

export function getMonitoringManager(): MonitoringManager {
  if (!globalThis.globalMonitoringManager) {
    globalThis.globalMonitoringManager = new MonitoringManager();
    globalThis.globalMonitoringManager.init().catch(console.error);
  }
  return globalThis.globalMonitoringManager;
}
