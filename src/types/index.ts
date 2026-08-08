export type MonitoringStatus = 'MONITORING' | 'LIVE_DETECTED' | 'IDLE' | 'UNKNOWN';

export interface MonitoredAccountDTO {
  id: string;
  username: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  status: MonitoringStatus;
  isActive: boolean;
  lastCheckedAt?: string | null;
  lastDetectedAt?: string | null;
  currentHost?: string | null;
  currentLiveUrl?: string | null;
  currentLiveTitle?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    liveEvents: number;
  };
}

export interface TargetHostDTO {
  id: string;
  hostUsername: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  isLive: boolean;
  currentTitle?: string | null;
  viewerCount: number;
  streamUrl?: string | null;
  isActive: boolean;
  lastCheckedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LiveEventDTO {
  id: string;
  monitoredAccountId: string;
  monitoredUsername: string;
  hostUsername: string;
  liveTitle?: string | null;
  liveUrl: string;
  detectedAt: string;
  exitAt?: string | null;
  durationSeconds?: number | null;
  detectionSource: string;
  metadataJson?: string | null;
  createdAt: string;
  monitoredAccount?: {
    nickname?: string | null;
    avatarUrl?: string | null;
  };
}

export interface NotificationDTO {
  id: string;
  liveEventId?: string | null;
  title: string;
  message: string;
  type: 'LIVE_DETECTED' | 'STATUS_CHANGE' | 'SYSTEM_ALERT';
  isRead: boolean;
  createdAt: string;
  liveEvent?: LiveEventDTO | null;
}

export interface SystemLogDTO {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';
  category: string;
  message: string;
  detailsJson?: string | null;
  createdAt: string;
}

export interface RealtimeEventPayload {
  type: 'LIVE_DETECTED' | 'HOST_STATUS_CHANGE' | 'ACCOUNT_STATUS_CHANGE' | 'HEARTBEAT' | 'NOTIFICATION';
  timestamp: string;
  data: {
    event?: LiveEventDTO;
    account?: Partial<MonitoredAccountDTO>;
    host?: Partial<TargetHostDTO>;
    notification?: NotificationDTO;
    message?: string;
  };
}

export interface AppSettingsDTO {
  soundEnabled: boolean;
  soundType: 'chime' | 'radar' | 'alarm' | 'subtle';
  soundVolume: number;
  browserNotifications: boolean;
  autoDismissSeconds: number;
  monitoringInterval: number;
  streamProvider: 'auto' | 'webcast' | 'simulation';
}
