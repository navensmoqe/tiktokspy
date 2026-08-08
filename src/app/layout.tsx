import type { Metadata } from "next";
import "./globals.css";
import { RealtimeProvider } from "@/context/RealtimeContext";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "رادار تيك توك لايف | مراقبة ورصد دخول المشاهدين للبث المباشر",
  description:
    "نظام احترافي لمراقبة حسابات تيك توك المحددة ورصد لحظة دخولها كمشاهدين إلى أي بث مباشر (TikTok LIVE) في الوقت الفعلي مع إشعارات وتنبيهات صوتية فورية.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-[#0f1015] text-zinc-100 min-h-screen antialiased selection:bg-tiktok-cyan/20 selection:text-tiktok-cyan font-sans">
        <RealtimeProvider>
          <AppShell>{children}</AppShell>
        </RealtimeProvider>
      </body>
    </html>
  );
}
