import { NextRequest } from "next/server";
import { subscribeRealtimeEvents } from "@/lib/eventBus";
import { getMonitoringManager } from "@/services/monitoringManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Ensure manager is initialized
  getMonitoringManager();

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connection event
  const initialPayload = `data: ${JSON.stringify({
    type: "CONNECTED",
    timestamp: new Date().toISOString(),
    data: { message: "SSE Real-time connection established" },
  })}\n\n`;
  writer.write(encoder.encode(initialPayload));

  // Subscribe to real-time events from EventBus
  const unsubscribe = subscribeRealtimeEvents(async (eventPayload) => {
    try {
      const data = `data: ${JSON.stringify(eventPayload)}\n\n`;
      await writer.write(encoder.encode(data));
    } catch {
      // Client disconnected
      unsubscribe();
    }
  });

  // Heartbeat interval to prevent socket timeout
  const heartbeatInterval = setInterval(async () => {
    try {
      const ping = `: ping\n\n`;
      await writer.write(encoder.encode(ping));
    } catch {
      clearInterval(heartbeatInterval);
      unsubscribe();
    }
  }, 20000);

  req.signal.addEventListener("abort", () => {
    clearInterval(heartbeatInterval);
    unsubscribe();
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Encoding": "none",
    },
  });
}
