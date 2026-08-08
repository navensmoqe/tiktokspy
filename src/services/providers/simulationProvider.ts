import { LiveStreamProvider, ViewerJoinEvent } from "./baseProvider";
import { logSystemEvent } from "@/lib/logger";

export class SimulationProvider implements LiveStreamProvider {
  public name = "SimulationProvider";
  private activeHosts: Set<string> = new Set();
  private callbacks: Map<string, (event: ViewerJoinEvent) => void> = new Map();
  private timer: NodeJS.Timeout | null = null;

  async connectToHost(hostUsername: string, onViewerJoin: (event: ViewerJoinEvent) => void): Promise<boolean> {
    const clean = hostUsername.replace(/^@+/, "").toLowerCase();
    this.activeHosts.add(clean);
    this.callbacks.set(clean, onViewerJoin);
    logSystemEvent("INFO", "MONITOR", `[Simulation] Registered virtual host @${clean}`);
    return true;
  }

  async disconnectFromHost(hostUsername: string): Promise<void> {
    const clean = hostUsername.replace(/^@+/, "").toLowerCase();
    this.activeHosts.delete(clean);
    this.callbacks.delete(clean);
    logSystemEvent("INFO", "MONITOR", `[Simulation] Unregistered virtual host @${clean}`);
  }

  isConnected(hostUsername: string): boolean {
    const clean = hostUsername.replace(/^@+/, "").toLowerCase();
    return this.activeHosts.has(clean);
  }

  getActiveHosts(): string[] {
    return Array.from(this.activeHosts);
  }

  // Trigger an explicit synthetic event for any viewer entering any host room
  triggerSyntheticEvent(
    viewerUsername: string,
    hostUsername: string,
    customTitle?: string,
    nickname?: string
  ): ViewerJoinEvent {
    const cleanViewer = viewerUsername.replace(/^@+/, "").toLowerCase();
    const cleanHost = hostUsername.replace(/^@+/, "").toLowerCase();

    const event: ViewerJoinEvent = {
      hostUsername: cleanHost,
      viewerUsername: cleanViewer,
      viewerNickname: nickname || cleanViewer,
      liveTitle: customTitle || `🔥 Friday Night Chill & Gaming with @${cleanHost}`,
      liveUrl: `https://www.tiktok.com/@${cleanHost}/live`,
      viewerCount: Math.floor(Math.random() * 5000) + 120,
      timestamp: new Date(),
      rawPayload: { simulated: true, triggerTime: new Date().toISOString() },
    };

    const cb = this.callbacks.get(cleanHost);
    if (cb) {
      cb(event);
    }

    return event;
  }

  async destroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.activeHosts.clear();
    this.callbacks.clear();
  }
}
