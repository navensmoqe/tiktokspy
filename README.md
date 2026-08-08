# 🔴 TikTok LIVE Viewer Spy & Radar | رادار مراقبة دخول بث التيك توك

منصة ويب متطورة وفورية باللغة العربية لمراقبة حسابات تيك توك المحددة ورصد لحظة دخولها كمشاهدين إلى غرف البث المباشر (TikTok LIVE) مع تنبيهات مرئية وصوتية وإشعارات فورية.

---

## ✨ المميزات الرئيسية (Key Features)

- 👥 **إدارة الحسابات المراقبة (Monitored Watchlist)**:
  - إضافة وحذف حسابات تيك توك ومراقبة حسابات متعددة في نفس الوقت.
  - مؤشرات حالة لحظية: 🟢 قيد المراقبة / 🔴 تم رصد نشاط مباشر / ⚪ لا يوجد نشاط بث / 🟡 غير معروف.
- 🔴 **تنبيهات فورية لحظية (Real-Time Alerts)**:
  - بطاقة تنبيه حمراء متوهجة توضح اسم المشاهد، صاحب البث، عنوان البث، وقت الرصد، ورابط البث المباشر.
  - نغمات تنبيهية مركبة لحظياً عبر **Web Audio API** (مسح الرادار، رنين نغمي، إنذار طوارئ، نبضة هادئة) بدون ملفات خارجية.
  - دعم إشعارات سطح المكتب (**Desktop Browser Push Notifications**).
- 📡 **قنوات البث المستهدفة (Target Streamers / Hosts)**:
  - الاتصال المباشر بغرف بث المشاهير والمضيفين عبر سوكت Webcast.
  - فحص حالة البث ورقم الغرفة (Room ID) بضغطة زر.
- 📜 **سجل النشاطات والأرشيف الزمني (Activity History)**:
  - تتبع كامل لكافة أحداث الدخول مع البحث والتصفية.
  - تصدير تقارير بصيغة **CSV** بضغطة واحدة.
- 🧪 **استوديو المحاكاة والاختبار (Simulation Studio)**:
  - محاكاة الأحداث وتجربة استجابة التنبيهات والنغمات دون المساس بقاعدة البيانات.
- ⚙️ **الإعدادات وسجلات النظام (Settings & Audit Logs)**:
  - تخصيص مستوى الصوت ونوع النغمة وزمن الإشعار.
  - استعراض سجلات التدقيق البرمجية للنظام مباشرة.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS, Lucide Icons
- **Backend / Real-time**: Node.js, Server-Sent Events (SSE), EventEmitter Pub/Sub
- **Database & ORM**: SQLite, Prisma ORM
- **Protocols**: Webcast WebSocket protocol via `tiktok-live-connector` (v2.4+)
- **Audio & Push**: Web Audio API Synthesizer, Browser Notifications API
- **Localization**: Arabic (RTL) مع خطوط Cairo & Tajawal

---

## 🚀 طريقة التثبيت والتشغيل المحلي (Getting Started)

### 1. استنساخ المشروع (Clone):
```bash
git clone https://github.com/navensmoqe/tiktokspy.git
cd tiktokspy
```

### 2. تثبيت الحزم (Install Dependencies):
```bash
npm install
```

### 3. إعداد قاعدة البيانات (Setup SQLite Database):
```bash
npx prisma db push
```

### 4. تشغيل السيرفر (Start Dev Server):
```bash
npm run dev
```
افتح المتصفح على: `http://localhost:3005` أو `http://localhost:3000`.

---

## 📄 الترخيص (License)
MIT License
