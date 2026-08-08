// HTML5 Web Push & Chrome Mobile Notification Helper with Service Worker support

let swRegistration: ServiceWorkerRegistration | null = null;

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      swRegistration = reg;
      console.log("[ServiceWorker] Registered successfully for Chrome Mobile Push:", reg.scope);
    })
    .catch((err) => {
      console.warn("[ServiceWorker] Registration failed:", err);
    });
}

export class BrowserNotificationHelper {
  public static isSupported(): boolean {
    return typeof window !== "undefined" && ("Notification" in window || "serviceWorker" in navigator);
  }

  public static getPermission(): NotificationPermission | "unsupported" {
    if (!this.isSupported() || typeof Notification === "undefined") return "unsupported";
    return Notification.permission;
  }

  public static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      if (typeof Notification !== "undefined") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }
      return false;
    } catch {
      return false;
    }
  }

  public static async send(
    title: string,
    options?: NotificationOptions & { url?: string }
  ): Promise<boolean> {
    if (!this.isSupported()) return false;

    // Check permission
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    const clickUrl = options?.url || "/";

    // 1. Mobile Vibration API (if supported by phone hardware)
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([300, 100, 300, 100, 300]);
      } catch {}
    }

    // 2. Google Chrome Mobile requires ServiceWorkerRegistration.showNotification()
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      try {
        const reg = swRegistration || (await navigator.serviceWorker.ready);
        if (reg && typeof reg.showNotification === "function") {
          await reg.showNotification(title, {
            body: options?.body || "تم رصد نشاط بث مباشر جديد!",
            icon: "https://api.dicebear.com/7.x/bottts/svg?seed=tiktokradar",
            badge: "https://api.dicebear.com/7.x/bottts/svg?seed=tiktokradar",
            vibrate: [300, 100, 300, 100, 300],
            data: { url: clickUrl },
            requireInteraction: true,
            tag: "tiktok-live-" + Date.now(),
            ...options,
          } as any);
          return true;
        }
      } catch (err) {
        console.warn("[ServiceWorker Push] Failed, falling back to Notification API:", err);
      }
    }

    // 3. Fallback for Desktop Browsers
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        const notif = new Notification(title, {
          body: options?.body,
          icon: "https://api.dicebear.com/7.x/bottts/svg?seed=tiktokradar",
          badge: "https://api.dicebear.com/7.x/bottts/svg?seed=tiktokradar",
          ...options,
        });

        notif.onclick = () => {
          window.focus();
          if (clickUrl && clickUrl !== "/") {
            window.open(clickUrl, "_blank");
          }
          notif.close();
        };

        return true;
      } catch (e) {
        console.warn("Desktop notification fallback error:", e);
      }
    }

    return false;
  }
}
