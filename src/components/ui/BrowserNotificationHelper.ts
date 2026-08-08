// HTML5 Browser Notifications API wrapper

export class BrowserNotificationHelper {
  public static isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  public static getPermission(): NotificationPermission | "unsupported" {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission;
  }

  public static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch {
      return false;
    }
  }

  public static send(title: string, options?: NotificationOptions): Notification | null {
    if (!this.isSupported() || Notification.permission !== "granted") {
      return null;
    }

    try {
      const notif = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        silent: false,
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      return notif;
    } catch (e) {
      console.warn("Failed to display desktop notification:", e);
      return null;
    }
  }
}
