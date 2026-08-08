export interface ViewerJoinEvent {
  hostUsername: string;
  viewerUsername: string;
  viewerNickname?: string;
  viewerAvatar?: string;
  liveTitle?: string;
  liveUrl: string;
  viewerCount?: number;
  timestamp: Date;
  rawPayload?: Record<string, unknown>;
}

export interface LiveStreamProvider {
  name: string;
  connectToHost(hostUsername: string, onViewerJoin: (event: ViewerJoinEvent) => void): Promise<boolean>;
  disconnectFromHost(hostUsername: string): Promise<void>;
  isConnected(hostUsername: string): boolean;
  getActiveHosts(): string[];
  destroy(): Promise<void>;
}
