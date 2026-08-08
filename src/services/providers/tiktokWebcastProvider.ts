import { LiveStreamProvider, ViewerJoinEvent } from "./baseProvider";
import { logSystemEvent } from "@/lib/logger";

interface ConnectionWrapper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: any;
  hostUsername: string;
  isLive: boolean;
  onJoinCallback: (event: ViewerJoinEvent) => void;
}

export class TiktokWebcastProvider implements LiveStreamProvider {
  public name = "TiktokWebcastProvider";
  private connections: Map<string, ConnectionWrapper> = new Map();

  async connectToHost(hostUsername: string, onViewerJoin: (event: ViewerJoinEvent) => void): Promise<boolean> {
    const cleanHost = hostUsername.replace(/^@+/, "").toLowerCase();

    // Disconnect existing if any
    if (this.connections.has(cleanHost)) {
      await this.disconnectFromHost(cleanHost);
    }

    try {
      // Dynamic ESM import for Next.js 15
      const ttl = await import("tiktok-live-connector");
      const ConnectionClass = ttl.TikTokLiveConnection || (ttl as any).WebcastPushConnection || (ttl as any).default?.TikTokLiveConnection;

      if (!ConnectionClass) {
        throw new Error("Could not load TikTokLiveConnection from package.");
      }

      const connection = new ConnectionClass(cleanHost, {
        processInitialData: true,
        enableExtendedGiftInfo: false,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 1000,
        clientParams: {
          app_language: "ar-SA",
          device_platform: "web",
        },
      });

      const wrapper: ConnectionWrapper = {
        connection,
        hostUsername: cleanHost,
        isLive: false,
        onJoinCallback: onViewerJoin,
      };

      const handleUserActivity = (data: any, activityType: string) => {
        if (!data) return;
        const user = data.user || data;
        const rawUsername =
          user.displayId ||
          user.uniqueId ||
          data.displayId ||
          data.uniqueId;

        if (!rawUsername) return;

        const viewerUsername = String(rawUsername).replace(/^@+/, "").toLowerCase();
        const nickname =
          user.nickname ||
          data.nickname ||
          viewerUsername;
        const avatar =
          user.avatarThumb ||
          user.profilePictureUrl ||
          data.profilePictureUrl ||
          (user.profilePictureUrls && user.profilePictureUrls[0]);

        const joinEvent: ViewerJoinEvent = {
          hostUsername: cleanHost,
          viewerUsername,
          viewerNickname: nickname,
          viewerAvatar: avatar,
          liveTitle: `بث مباشر مع @${cleanHost}`,
          liveUrl: `https://www.tiktok.com/@${cleanHost}/live`,
          timestamp: new Date(),
          rawPayload: { ...data, activityType },
        };

        onViewerJoin(joinEvent);
      };

      // 1. Member join event (WebcastMemberMessage)
      connection.on("member", (data: any) => {
        handleUserActivity(data, "MEMBER_JOIN");
      });

      // 2. Chat message event (WebcastChatMessage) - if user chats, they are inside the live
      connection.on("chat", (data: any) => {
        handleUserActivity(data, "CHAT_MESSAGE");
      });

      // 3. Like event - if user likes the live stream
      connection.on("like", (data: any) => {
        handleUserActivity(data, "LIKE_STREAM");
      });

      // Stream status listeners
      connection.on("streamEnd", () => {
        wrapper.isLive = false;
        logSystemEvent("INFO", "WEBSOCKET", `انتهى البث المباشر للمضيف @${cleanHost}`);
      });

      connection.on("error", (err: Error) => {
        logSystemEvent("WARN", "WEBSOCKET", `تنبيه في اتصال بث @${cleanHost}: ${err?.message || err}`);
      });

      // Attempt connection to live room
      const state = await connection.connect();
      const roomId = state?.roomId || state?.roomInfo?.id || "نشط";
      wrapper.isLive = true;
      this.connections.set(cleanHost, wrapper);

      logSystemEvent(
        "INFO",
        "WEBSOCKET",
        `تم الاتصال بنجاح بغرفة البث المباشر للمضيف @${cleanHost} (Room ID: ${roomId})`
      );

      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logSystemEvent("WARN", "WEBSOCKET", `تعذر الاتصال ببث @${cleanHost}: ${errorMsg}`);
      return false;
    }
  }

  async disconnectFromHost(hostUsername: string): Promise<void> {
    const cleanHost = hostUsername.replace(/^@+/, "").toLowerCase();
    const wrapper = this.connections.get(cleanHost);
    if (wrapper) {
      try {
        if (wrapper.connection && typeof wrapper.connection.disconnect === "function") {
          wrapper.connection.disconnect();
        }
      } catch (err) {
        console.error(`Error disconnecting from @${cleanHost}:`, err);
      }
      this.connections.delete(cleanHost);
      logSystemEvent("INFO", "WEBSOCKET", `تم قطع الاتصال بقناة @${cleanHost}`);
    }
  }

  isConnected(hostUsername: string): boolean {
    const cleanHost = hostUsername.replace(/^@+/, "").toLowerCase();
    const wrapper = this.connections.get(cleanHost);
    return !!wrapper?.connection?.isConnected;
  }

  getActiveHosts(): string[] {
    return Array.from(this.connections.keys());
  }

  async destroy(): Promise<void> {
    const hosts = Array.from(this.connections.keys());
    for (const host of hosts) {
      await this.disconnectFromHost(host);
    }
  }
}
