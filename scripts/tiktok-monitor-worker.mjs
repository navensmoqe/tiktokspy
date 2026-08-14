import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({ log: ["error"] });
const connections = new Map();
const sessions = new Map();
const syncIntervalMs = 60_000;
const inactivityMs = 60_000;

const cleanUsername = (value) => String(value || "").replace(/^@+/, "").trim().toLowerCase();

async function writeLog(level, category, message, details) {
  await db.systemLog.create({
    data: { level, category, message, detailsJson: details ? JSON.stringify(details) : null },
  }).catch((error) => console.error("Log write failed:", error.message));
}

async function finishSession(key, session, reason) {
  const exitAt = session.lastActivityAt;
  const durationSeconds = Math.max(1, Math.round((exitAt - session.joinedAt) / 1000));
  await db.$transaction([
    db.liveEvent.update({ where: { id: session.eventId }, data: { exitAt, durationSeconds } }),
    db.monitoredAccount.update({
      where: { id: session.accountId },
      data: { status: "MONITORING", currentHost: null, currentLiveUrl: null, currentLiveTitle: null, lastCheckedAt: new Date() },
    }),
  ]);
  sessions.delete(key);
  await writeLog("AUDIT", "MONITOR", `Viewer @${session.viewerUsername} left @${session.hostUsername}`, { reason, durationSeconds });
}

async function recordActivity(hostUsername, payload, activityType) {
  const user = payload?.user || payload;
  const viewerUsername = cleanUsername(user?.displayId || user?.uniqueId || payload?.displayId || payload?.uniqueId);
  if (!viewerUsername) return;

  const account = await db.monitoredAccount.findUnique({ where: { username: viewerUsername } });
  if (!account?.isActive) return;

  const now = new Date();
  const sessionKey = `${viewerUsername}:${hostUsername}`;
  const existing = sessions.get(sessionKey);
  if (existing) {
    existing.lastActivityAt = now;
    await db.liveEvent.update({
      where: { id: existing.eventId },
      data: { durationSeconds: Math.max(1, Math.round((now - existing.joinedAt) / 1000)) },
    });
    return;
  }

  const liveUrl = `https://www.tiktok.com/@${hostUsername}/live`;
  const liveTitle = `TikTok LIVE with @${hostUsername}`;
  const event = await db.$transaction(async (tx) => {
    await tx.monitoredAccount.update({
      where: { id: account.id },
      data: { status: "LIVE_DETECTED", lastDetectedAt: now, lastCheckedAt: now, currentHost: hostUsername, currentLiveUrl: liveUrl, currentLiveTitle: liveTitle },
    });
    const created = await tx.liveEvent.create({
      data: {
        monitoredAccountId: account.id,
        monitoredUsername: viewerUsername,
        hostUsername,
        liveTitle,
        liveUrl,
        detectedAt: now,
        detectionSource: "WEBCAST_ROOM",
        durationSeconds: 1,
        metadataJson: JSON.stringify({ viewerNickname: user?.nickname || viewerUsername, activityType }),
      },
    });
    await tx.notification.create({
      data: { liveEventId: created.id, title: "TikTok LIVE activity detected", message: `@${viewerUsername} joined @${hostUsername}'s LIVE`, type: "LIVE_DETECTED" },
    });
    return created;
  });

  sessions.set(sessionKey, { eventId: event.id, accountId: account.id, viewerUsername, hostUsername, joinedAt: now, lastActivityAt: now });
  await writeLog("AUDIT", "MONITOR", `LIVE detected: @${viewerUsername} in @${hostUsername}`, { eventId: event.id, activityType });
}

async function disconnectHost(hostUsername, reason) {
  const connection = connections.get(hostUsername);
  connections.delete(hostUsername);
  try { connection?.disconnect?.(); } catch {}
  for (const [key, session] of sessions) {
    if (session.hostUsername === hostUsername) await finishSession(key, session, reason).catch(console.error);
  }
  await db.targetHost.update({ where: { hostUsername }, data: { isLive: false, lastCheckedAt: new Date() } }).catch(() => {});
}

async function connectHost(hostUsername) {
  if (connections.has(hostUsername)) return;
  const module = await import("tiktok-live-connector");
  const Connection = module.TikTokLiveConnection || module.WebcastPushConnection || module.default?.TikTokLiveConnection;
  if (!Connection) throw new Error("TikTok connection class is unavailable");

  const connection = new Connection(hostUsername, { processInitialData: true, enableExtendedGiftInfo: false });
  connections.set(hostUsername, connection);
  connection.on("member", (data) => recordActivity(hostUsername, data, "MEMBER_JOIN").catch(console.error));
  connection.on("chat", (data) => recordActivity(hostUsername, data, "CHAT_MESSAGE").catch(console.error));
  connection.on("like", (data) => recordActivity(hostUsername, data, "LIKE_STREAM").catch(console.error));
  connection.on("streamEnd", () => disconnectHost(hostUsername, "Stream ended").catch(console.error));
  connection.on("error", (error) => writeLog("WARN", "WEBSOCKET", `TikTok error for @${hostUsername}: ${error?.message || error}`).catch(console.error));

  try {
    const state = await connection.connect();
    await db.targetHost.update({ where: { hostUsername }, data: { isLive: true, lastCheckedAt: new Date() } });
    await writeLog("INFO", "WEBSOCKET", `Worker connected to @${hostUsername}`, { roomId: state?.roomId || state?.roomInfo?.id });
  } catch (error) {
    connections.delete(hostUsername);
    await db.targetHost.update({ where: { hostUsername }, data: { isLive: false, lastCheckedAt: new Date() } });
    await writeLog("WARN", "WEBSOCKET", `Worker could not connect to @${hostUsername}: ${error.message}`);
  }
}

async function sync() {
  const hosts = await db.targetHost.findMany({ where: { isActive: true }, select: { hostUsername: true } });
  const activeHosts = new Set(hosts.map((host) => host.hostUsername));
  for (const hostUsername of activeHosts) {
    await connectHost(hostUsername).catch((error) =>
      writeLog("WARN", "WEBSOCKET", `Worker host sync failed for @${hostUsername}: ${error.message}`)
    );
  }
  for (const hostUsername of [...connections.keys()]) {
    if (!activeHosts.has(hostUsername)) await disconnectHost(hostUsername, "Host disabled");
  }
  const now = new Date();
  for (const [key, session] of sessions) {
    if (now - session.lastActivityAt >= inactivityMs) await finishSession(key, session, "Inactivity timeout").catch(console.error);
  }
}

async function shutdown() {
  for (const hostUsername of [...connections.keys()]) await disconnectHost(hostUsername, "Worker shutdown");
  await db.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
await writeLog("INFO", "MONITOR", "TikTok monitor worker started");
await sync();
setInterval(() => sync().catch((error) => console.error("Host sync failed:", error)), syncIntervalMs);
