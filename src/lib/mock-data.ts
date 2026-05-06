import { Cpu, Gamepad2, Wrench, Sparkles, MonitorSpeaker, HardDrive } from "lucide-react";

export const categories = [
  {
    id: "assembly",
    title: "مونتاژ PC",
    description: "راهنمای ساخت، انتخاب قطعات و مونتاژ",
    icon: Cpu,
    threads: 1248,
    color: "from-orange-500/20 to-amber-500/10",
  },
  {
    id: "games",
    title: "گیمینگ و ستاپ",
    description: "نصب، اجرا و بهینه‌سازی بازی‌ها و تنظیمات",
    icon: Gamepad2,
    threads: 892,
    color: "from-rose-500/20 to-orange-500/10",
  },
  {
    id: "showcase",
    title: "نمایش سیستم‌ها",
    description: "اشتراک‌گذاری ستاپ و اسمبل‌ها",
    icon: Sparkles,
    threads: 657,
    color: "from-fuchsia-500/15 to-orange-500/10",
  },
  {
    id: "peripherals",
    title: "مانیتور و لوازم جانبی",
    description: "مانیتور، کیبورد، موس و هدست",
    icon: MonitorSpeaker,
    threads: 421,
    color: "from-cyan-500/15 to-orange-500/10",
  },
  {
    id: "troubleshoot",
    title: "عیب‌یابی",
    description: "رفع مشکلات GPU، CPU، خنک‌کننده و پاور",
    icon: Wrench,
    threads: 2104,
    color: "from-amber-500/20 to-yellow-500/10",
  },
  {
    id: "storage",
    title: "حافظه و ذخیره‌سازی",
    description: "SSD، HDD و مدیریت داده",
    icon: HardDrive,
    threads: 312,
    color: "from-emerald-500/15 to-orange-500/10",
  },
];

export const threads = [
  {
    id: "1",
    title: "افت شدید FPS با RTX 4070 در Cyberpunk (تنظیمات Ultra)",
    author: { name: "آرش رضایی", avatar: "AR" },
    category: "عیب‌یابی",
    tags: ["GPU", "FPS", "Cyberpunk"],
    replies: 24,
    views: 1340,
    likes: 87,
    time: "۲ ساعت پیش",
    excerpt:
      "سلام. تازه RTX 4070 خریدم ولی در Cyberpunk روی Ultra دما بالای ۸۰ می‌رود و FPS تا حدود ۴۰ می‌افتد. پیشنهادی دارید؟",
    pinned: true,
    hot: true,
  },
  {
    id: "2",
    title: "بهترین چینش فن برای NZXT H7 Flow چیست؟",
    author: { name: "سارا محمدی", avatar: "SM" },
    category: "مونتاژ PC",
    tags: ["Cooling", "Airflow", "NZXT"],
    replies: 18,
    views: 892,
    likes: 54,
    time: "۵ ساعت پیش",
    excerpt: "می‌خواهم ۶ فن نصب کنم. چه چیدمانی بهترین جریان هوا را می‌دهد؟",
  },
  {
    id: "3",
    title: "ستاپ جدید با تم نارنجی — نظرتون چیه؟",
    author: { name: "محمد کریمی", avatar: "MK" },
    category: "نمایش سیستم‌ها",
    tags: ["Setup", "RGB", "Build"],
    replies: 42,
    views: 2104,
    likes: 213,
    time: "۸ ساعت پیش",
    excerpt: "بعد از ۳ ماه بالاخره سیستمم کامل شد. RTX 4080 + Ryzen 7 7800X3D.",
    hot: true,
  },
  {
    id: "4",
    title: "استیم دانلود می‌کند ولی نصب نمی‌شود — خطای 0xC0000005",
    author: { name: "علی نوری", avatar: "AN" },
    category: "گیمینگ و ستاپ",
    tags: ["Steam", "Error", "Windows"],
    replies: 11,
    views: 478,
    likes: 23,
    time: "دیروز",
    excerpt: "هر بار نصب می‌کنم این خطا را می‌گیرم. ویندوز ۱۱، آنتی‌ویروس هم خاموش است.",
  },
  {
    id: "5",
    title: "برای Ryzen 9 7950X واترکولینگ لازم است؟",
    author: { name: "نگین حسینی", avatar: "NH" },
    category: "مونتاژ PC",
    tags: ["AIO", "AMD", "Cooling"],
    replies: 31,
    views: 1567,
    likes: 98,
    time: "دیروز",
    excerpt: "کولر Noctua NH-D15 دارم. برای 7950X کافی هست یا AIO بگیرم؟",
  },
  {
    id: "6",
    title: "DDR5 6000 یا 6400 — تفاوت واقعی در بازی؟",
    author: { name: "رضا فلاحی", avatar: "RF" },
    category: "مونتاژ PC",
    tags: ["RAM", "DDR5", "Gaming"],
    replies: 7,
    views: 312,
    likes: 19,
    time: "۲ روز پیش",
    excerpt: "اختلاف قیمت محسوس است. ارزشش را دارد؟",
  },
];

export const replies = [
  {
    id: "r1",
    author: { name: "حسین مرادی", avatar: "HM", role: "متخصص سخت‌افزار" },
    time: "۱ ساعت پیش",
    likes: 34,
    content:
      "معمولاً به خاطر تنظیمات Ray Tracing است. DLSS را روی Quality بگذارید و Ray Tracing را به Medium کاهش دهید. اگر دما هنوز بالاست، احتمالاً مشکل از جریان هوای کیس است.",
  },
  {
    id: "r2",
    author: { name: "زهرا اکبری", avatar: "ZA" },
    time: "۴۵ دقیقه پیش",
    likes: 12,
    content:
      "من هم همین مشکل را داشتم. درایور را با DDU پاک کنید و آخرین NVIDIA Studio Driver را نصب کنید—برای من خیلی بهتر شد.",
  },
  {
    id: "r3",
    author: { name: "امیر صالحی", avatar: "AS" },
    time: "۲۰ دقیقه پیش",
    likes: 8,
    content: "تنظیمات پیشنهادی من برای RTX 4070:",
    code: `Resolution: 1440p
DLSS: Quality
Ray Tracing: Medium
Frame Generation: ON
Shadows: High
Crowd Density: Medium`,
  },
];

export const adminQueue = [
  { id: "p1", title: "راهنمای کامل اورکلاک Ryzen 7800X3D", author: "مهدی رستمی", category: "مونتاژ PC", date: "2026-05-01", status: "pending" as const },
  { id: "p2", title: "بهترین SSDهای NVMe در سال ۲۰۲۶", author: "فاطمه شریفی", category: "حافظه و ذخیره‌سازی", date: "2026-05-01", status: "pending" as const },
  { id: "p3", title: "سیستم ۱۵۰۰ دلاری برای گیمینگ 4K", author: "بهزاد کاظمی", category: "نمایش سیستم‌ها", date: "2026-04-30", status: "approved" as const },
  { id: "p4", title: "اسپم تبلیغاتی — نادیده بگیرید", author: "spammer123", category: "متفرقه", date: "2026-04-30", status: "rejected" as const },
  { id: "p5", title: "بعد از نصب GPU جدید ویندوز بوت نمی‌شود", author: "علی محمدی", category: "عیب‌یابی", date: "2026-04-29", status: "pending" as const },
];
