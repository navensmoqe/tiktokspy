import { EventEmitter } from "events";
import { RealtimeEventPayload } from "@/types";

declare global {
  // eslint-disable-next-line no-var
  var globalEventBus: EventEmitter | undefined;
}

const eventBus = globalThis.globalEventBus || new EventEmitter();
eventBus.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalThis.globalEventBus = eventBus;
}

export const REALTIME_CHANNEL = "TIKTOK_MONITOR_EVENT";

export function emitRealtimeEvent(payload: RealtimeEventPayload) {
  eventBus.emit(REALTIME_CHANNEL, payload);
}

export function subscribeRealtimeEvents(listener: (payload: RealtimeEventPayload) => void) {
  eventBus.on(REALTIME_CHANNEL, listener);
  return () => {
    eventBus.off(REALTIME_CHANNEL, listener);
  };
}

export default eventBus;
