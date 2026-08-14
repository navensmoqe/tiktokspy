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

interface ViewerSession {
  eventId: string;
  accountId: string;
  viewerUsername: string;
  hostUsername: string;
  joinedAt: Date;
  lastActivityAt: Date;
  activityCount: number;
}

export class MonitoringManager {
  private webcastProvider: TiktokWebcastProvider;
  private simulationProvider: SimulationProvider;
  private isInitialized = false;
  private pollerTimer: NodeJS.Timeout | null = null;
  private activeSessions: Map<string, ViewerSession> = new Map();
  private inactivityTimeoutSeconds = 60; // Timeout after 60s of no room activity

  constructor() {
    this.webcastProvider = new TiktokWebcastProvider();
    this.simulationProvider = new SimulationProvider();
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    await logSystemEvent("INFO", "MONITOR", "Initializing MonitoringManager service with Precise Session Tracker...");
    await this.loadSettings();
    await this.syncActiveHosts();

    // Start periodic background session & heartbeat checker every 5 seconds for high precision
    if (!this.pollerTimer) {
      this.pollerTimer = setInterval(() => {
        this.runPeriodicCheck().catch((err) => {
          console.error("Error in monitoring periodic check:", err);
        });
      }, 5000);
    }
  }

  public async loadSettings(): Promise<void> {
    try {
      const setting = await db.appSetting.findUnique({
        where: { key: "inactivityTimeoutSeconds" },
      });
      if (setting) {
        this.inactivityTimeoutSeconds = Math.max(15, parseInt(JSON.parse(setting.value)) || 60);
      }
    } catch {}
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

        // Connect to live webcast stream
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
    await this.closeSessionsForHost(clean, "Stream unregistered or disconnected");
    await this.simulationProvider.disconnectFromHost(clean);
    await this.webcastProvider.disconnectFromHost(clean);
  }

  public async handleViewerJoin(event: ViewerJoinEvent, customSource?: string): Promise<void> {
    const cleanViewer = event.viewerUsername.replace(/^@+/, "").toLowerCase();
    const cleanHost = event.hostUsername.replace(/^@+/, "").toLowerCase();
    const source = customSource || (event.rawPayload?.simulated ? "SIMULATION" : "WEBCAST_ROOM");
    const now = new Date();
    const sessionKey = `${cleanViewer}:${cleanHost}`;

    // Check if viewer is in monitored accounts
    const account = await db.monitoredAccount.findFirst({
      where: {
        username: cleanViewer,
        isActive: true,
      },
    });

    if (!account) {
      // If simulated and user wants to test UI alert, dispatch SSE payload without altering DB
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

    // Check if we already have an active presence session for this user in this stream
    const existingSession = this.activeSessions.get(sessionKey);

    if (existingSession) {
      // User is already in the live room — update last activity timestamp to keep session active
      existingSession.lastActivityAt = now;
      existingSession.activityCount++;
      const currentDuration = Math.max(1, Math.round((now.getTime() - existingSession.joinedAt.getTime()) / 1000));

      // Update current LiveEvent duration in DB
      await db.liveEvent.update({
        where: { id: existingSession.eventId },
        data: { durationSeconds: currentDuration },
      });

      return;
    }

    // 1. Update Monitored Account status to LIVE_DETECTED
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

    // 2. Create new LiveEvent record
    const liveEvent = await db.liveEvent.create({
      data: {
        monitoredAccountId: account.id,
        monitoredUsername: cleanViewer,
        hostUsername: cleanHost,
        liveTitle: event.liveTitle || `بث مباشر للمضيف @${cleanHost}`,
        liveUrl: event.liveUrl,
        detectedAt: now,
        detectionSource: source,
        durationSeconds: 1,
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

    // 3. Register in Active Session Tracker
    this.activeSessions.set(sessionKey, {
      eventId: liveEvent.id,
      accountId: account.id,
      viewerUsername: cleanViewer,
      hostUsername: cleanHost,
      joinedAt: now,
      lastActivityAt: now,
      activityCount: 1,
    });

    // 4. Create Notification
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

    // 5. Log Audit Event
    await logSystemEvent("AUDIT", "MONITOR", `LIVE Detected: @${cleanViewer} entered @${cleanHost}'s live room`, {
      eventId: liveEvent.id,
      liveUrl: event.liveUrl,
      source,
    });

    // 6. Emit Real-time SSE Dispatch
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

  public async closeSessionsForHost(hostUsername: string, reason: string): Promise<void> {
    const cleanHost = hostUsername.replace(/^@+/, "").toLowerCase();
    const now = new Date();

    for (const [key, session] of Array.from(this.activeSessions.entries())) {
      if (session.hostUsername === cleanHost) {
        await this.finalizeExitSession(key, session, now, reason);
      }
    }
  }

  private async finalizeExitSession(
    sessionKey: string,
    session: ViewerSession,
    exitTime: Date,
    reason: string
  ): Promise<void> {
    try {
      const durationSeconds = Math.max(
        1,
        Math.round((exitTime.getTime() - session.joinedAt.getTime()) / 1000)
      );

      // 1. Update LiveEvent with exact exitAt and precise duration
      await db.liveEvent.update({
        where: { id: session.eventId },
        data: {
          exitAt: exitTime,
          durationSeconds,
        },
      });

      // 2. Reset MonitoredAccount status back to MONITORING
      const updatedAccount = await db.monitoredAccount.update({
        where: { id: session.accountId },
        data: {
          status: "MONITORING",
          currentHost: null,
          currentLiveUrl: null,
          currentLiveTitle: null,
          lastCheckedAt: new Date(),
        },
      });

      // 3. Log Audit
      await logSystemEvent(
        "AUDIT",
        "MONITOR",
        `Viewer @${session.viewerUsername} exited stream @${session.hostUsername} (${durationSeconds}s, reason: ${reason})`,
        {
          eventId: session.eventId,
          exitAt: exitTime.toISOString(),
          durationSeconds,
        }
      );

      // 4. Emit ACCOUNT_STATUS_CHANGE SSE event
      emitRealtimeEvent({
        type: "ACCOUNT_STATUS_CHANGE",
        timestamp: new Date().toISOString(),
        data: {
          accountId: session.accountId,
          username: session.viewerUsername,
          status: "MONITORING",
          previousEventId: session.eventId,
          exitAt: exitTime.toISOString(),
          durationSeconds,
          account: {
            id: updatedAccount.id,
            username: updatedAccount.username,
            status: "MONITORING",
            currentHost: null,
            currentLiveUrl: null,
            currentLiveTitle: null,
          },
        },
      });

      // Remove from memory
      this.activeSessions.delete(sessionKey);
    } catch (err) {
      console.error(`Error finalizing exit session for ${sessionKey}:`, err);
    }
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
      // 1. Evaluate Active Sessions for Inactivity Timeout
      for (const [key, session] of Array.from(this.activeSessions.entries())) {
        const secondsSinceActivity = Math.round((now.getTime() - session.lastActivityAt.getTime()) / 1000);

        if (secondsSinceActivity >= this.inactivityTimeoutSeconds) {
          // Exact departure timestamp is when they were last active in the room
          const exactExitTime = session.lastActivityAt;
          await this.finalizeExitSession(key, session, exactExitTime, "Inactivity timeout (Viewer left room)");
        }
      }

      // 2. Update lastCheckedAt on active accounts
      await db.monitoredAccount.updateMany({
        where: { isActive: true },
        data: { lastCheckedAt: now },
      });

      // 3. Emit heartbeat to keep SSE connections healthy
      emitRealtimeEvent({
        type: "HEARTBEAT",
        timestamp: now.toISOString(),
        data: {
          activeSessionsCount: this.activeSessions.size,
          message: "System health OK",
        },
      });
    } catch (err) {
      console.error("Session check error:", err);
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
