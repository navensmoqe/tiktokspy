// Service Worker for Chrome Mobile & Desktop Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const clickUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open
      for (const client of windowClients) {
        if ("focus" in client) {
          if (client.url === clickUrl && "focus" in client) {
            return client.focus();
          }
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(clickUrl);
      }
    })
  );
});

// Handle push events (for web push server integrations)
self.addEventListener("push", (event) => {
  let payload = {
    title: "🔴 رصد بث مباشر جديد - تيك توك",
    body: "تم رصد نشاط مشاهد في بث مباشر الآن!",
    url: "/",
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [300, 100, 300, 100, 300],
    data: {
      url: payload.url || "/",
    },
    actions: [
      { action: "open_live", title: "🔴 فتح البث المباشر" },
      { action: "open_dashboard", title: "📊 لوحة التحكم" },
    ],
    requireInteraction: true,
    tag: "tiktok-live-alert-" + Date.now(),
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});
