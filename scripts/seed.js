const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding TikTok LIVE Monitor database...");

  // 1. Monitored Accounts
  const accounts = [
    {
      username: "sarah_travels",
      nickname: "Sarah | Travel Vlogs",
      status: "MONITORING",
      isActive: true,
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=sarah_travels",
      lastCheckedAt: new Date(),
    },
    {
      username: "alex_gaming",
      nickname: "Alex Gaming PRO",
      status: "MONITORING",
      isActive: true,
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=alex_gaming",
      lastCheckedAt: new Date(),
    },
    {
      username: "tech_guru",
      nickname: "Tech Reviews & AI",
      status: "MONITORING",
      isActive: true,
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=tech_guru",
      lastCheckedAt: new Date(),
    },
    {
      username: "lisa_dance",
      nickname: "Lisa Dances",
      status: "IDLE",
      isActive: false,
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=lisa_dance",
      lastCheckedAt: new Date(),
    },
  ];

  for (const acc of accounts) {
    await prisma.monitoredAccount.upsert({
      where: { username: acc.username },
      create: acc,
      update: acc,
    });
  }

  // 2. Target Hosts
  const hosts = [
    {
      hostUsername: "mr_beast_live",
      nickname: "MrBeast LIVE Challenges",
      streamUrl: "https://www.tiktok.com/@mr_beast_live/live",
      avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=mr_beast_live",
      isLive: true,
      currentTitle: "🎁 $50,000 Live Giveaway & Creator Battles!",
      isActive: true,
    },
    {
      hostUsername: "ninja_stream",
      nickname: "Ninja Gaming Room",
      streamUrl: "https://www.tiktok.com/@ninja_stream/live",
      avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=ninja_stream",
      isLive: false,
      currentTitle: "🎮 Ranked Duos & Chill Night",
      isActive: true,
    },
    {
      hostUsername: "elon_insights",
      nickname: "Elon Tech Talk",
      streamUrl: "https://www.tiktok.com/@elon_insights/live",
      avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=elon_insights",
      isLive: false,
      currentTitle: "🚀 AI & Space Engineering Q&A",
      isActive: true,
    },
  ];

  for (const host of hosts) {
    await prisma.targetHost.upsert({
      where: { hostUsername: host.hostUsername },
      create: host,
      update: host,
    });
  }

  // 3. Initial Sample Event
  const sarah = await prisma.monitoredAccount.findUnique({
    where: { username: "sarah_travels" },
  });

  if (sarah) {
    const existingEvents = await prisma.liveEvent.count();
    if (existingEvents === 0) {
      const pastEvent = await prisma.liveEvent.create({
        data: {
          monitoredAccountId: sarah.id,
          monitoredUsername: "sarah_travels",
          hostUsername: "mr_beast_live",
          liveTitle: "🎁 $50,000 Live Giveaway & Creator Battles!",
          liveUrl: "https://www.tiktok.com/@mr_beast_live/live",
          detectedAt: new Date(Date.now() - 3600000 * 2),
          exitAt: new Date(Date.now() - 3600000 * 1.5),
          durationSeconds: 1800,
          detectionSource: "WEBCAST_ROOM",
          metadataJson: JSON.stringify({
            viewerNickname: "Sarah | Travel Vlogs",
            viewerCount: 24500,
          }),
        },
      });

      await prisma.notification.create({
        data: {
          liveEventId: pastEvent.id,
          title: "🔴 LIVE Activity Detected",
          message: "@sarah_travels entered a LIVE hosted by @mr_beast_live",
          type: "LIVE_DETECTED",
          isRead: true,
        },
      });
    }
  }

  // 4. Initial System Log
  await prisma.systemLog.create({
    data: {
      level: "INFO",
      category: "GENERAL",
      message: "Database initialized with starter watchlist and stream listeners.",
    },
  });

  console.log("Seeding completed successfully!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
