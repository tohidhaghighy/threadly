import { Cpu, Gamepad2, Wrench, Sparkles, MonitorSpeaker, HardDrive } from "lucide-react";

export const categories = [
  {
    id: "assembly",
    title: "مونتاژ کیس",
    description: "راهنماها و گفتگوهای مونتاژ کامپیوتر",
    icon: Cpu,
    threads: 1248,
    color: "from-orange-500/20 to-amber-500/10",
  },
  {
    id: "games",
    title: "نصب بازی",
    description: "نصب، اجرا و بهینه‌سازی بازی‌ها",
    icon: Gamepad2,
    threads: 892,
    color: "from-rose-500/20 to-orange-500/10",
  },
  {
    id: "troubleshoot",
    title: "عیب‌یابی سخت‌افزار",
    description: "حل مشکلات GPU، CPU، خنک‌کننده و برق",
    icon: Wrench,
    threads: 2104,
    color: "from-amber-500/20 to-yellow-500/10",
  },
  {
    id: "showcase",
    title: "ست‌آپ من",
    description: "ست‌آپ‌ها و بیلدهای خود را به اشتراک بگذارید",
    icon: Sparkles,
    threads: 657,
    color: "from-fuchsia-500/15 to-orange-500/10",
  },
  {
    id: "peripherals",
    title: "جانبی و مانیتور",
    description: "مانیتور، کیبورد، ماوس و هدست",
    icon: MonitorSpeaker,
    threads: 421,
    color: "from-cyan-500/15 to-orange-500/10",
  },
  {
    id: "storage",
    title: "ذخیره‌سازی",
    description: "SSD، HDD و مدیریت داده",
    icon: HardDrive,
    threads: 312,
    color: "from-emerald-500/15 to-orange-500/10",
  },
];

export const threads = [
  {
    id: "1",
    title: "کارت گرافیک RTX 4070 من در بازی Cyberpunk افت فریم شدید دارد",
    author: { name: "آرش رضایی", avatar: "AR" },
    category: "عیب‌یابی سخت‌افزار",
    tags: ["GPU", "FPS", "Cyberpunk"],
    replies: 24,
    views: 1340,
    likes: 87,
    time: "۲ ساعت پیش",
    excerpt: "سلام دوستان، تازه RTX 4070 خریدم ولی توی بازی Cyberpunk با تنظیمات Ultra دمای کارت بالای ۸۰ درجه می‌رود و فریم به ۴۰ می‌افتد...",
    pinned: true,
    hot: true,
  },
  {
    id: "2",
    title: "بهترین چیدمان فن‌ها برای کیس NZXT H7 Flow؟",
    author: { name: "سارا محمدی", avatar: "SM" },
    category: "مونتاژ کیس",
    tags: ["Cooling", "Airflow", "NZXT"],
    replies: 18,
    views: 892,
    likes: 54,
    time: "۵ ساعت پیش",
    excerpt: "می‌خوام ۶ تا فن نصب کنم. کدوم چیدمان بهترین جریان هوا رو میده؟",
  },
  {
    id: "3",
    title: "ست‌آپ جدیدم با تم نارنجی - نظراتتون چیه؟",
    author: { name: "محمد کریمی", avatar: "MK" },
    category: "ست‌آپ من",
    tags: ["Setup", "RGB", "Build"],
    replies: 42,
    views: 2104,
    likes: 213,
    time: "۸ ساعت پیش",
    excerpt: "بعد از ۳ ماه صبر بالاخره بیلدم تموم شد. RTX 4080 + Ryzen 7 7800X3D",
    hot: true,
  },
  {
    id: "4",
    title: "Steam بازی رو دانلود می‌کنه ولی نصب نمیشه - ارور 0xC0000005",
    author: { name: "علی نوری", avatar: "AN" },
    category: "نصب بازی",
    tags: ["Steam", "Error", "Windows"],
    replies: 11,
    views: 478,
    likes: 23,
    time: "دیروز",
    excerpt: "هر بار که می‌خوام نصب کنم این ارور میاد. ویندوز ۱۱، آنتی‌ویروس هم خاموش کردم",
  },
  {
    id: "5",
    title: "آیا Liquid Cooling برای Ryzen 9 7950X ضروری است؟",
    author: { name: "نگین حسینی", avatar: "NH" },
    category: "مونتاژ کیس",
    tags: ["AIO", "AMD", "Cooling"],
    replies: 31,
    views: 1567,
    likes: 98,
    time: "دیروز",
    excerpt: "ایر کولر Noctua NH-D15 دارم. آیا برای 7950X کافیه یا حتما باید برم سراغ AIO؟",
  },
  {
    id: "6",
    title: "DDR5 6000 یا 6400 - تفاوت واقعی در گیمینگ؟",
    author: { name: "رضا فلاحی", avatar: "RF" },
    category: "مونتاژ کیس",
    tags: ["RAM", "DDR5", "Gaming"],
    replies: 7,
    views: 312,
    likes: 19,
    time: "۲ روز پیش",
    excerpt: "اختلاف قیمت قابل توجهی هست. آیا ارزشش رو داره؟",
  },
];

export const replies = [
  {
    id: "r1",
    author: { name: "حسین مرادی", avatar: "HM", role: "متخصص سخت‌افزار" },
    time: "۱ ساعت پیش",
    likes: 34,
    content:
      "این مشکل معمولاً به خاطر تنظیمات Ray Tracing هست. اول DLSS رو روی Quality بذار و Ray Tracing رو روی Medium کم کن. اگر دما همچنان بالاست، احتمالاً جریان هوای کیست مشکل داره.",
  },
  {
    id: "r2",
    author: { name: "زهرا اکبری", avatar: "ZA" },
    time: "۴۵ دقیقه پیش",
    likes: 12,
    content: "من همین مشکل رو داشتم. درایور رو با DDU پاک کن و آخرین نسخه NVIDIA Studio رو نصب کن. خیلی فرق کرد!",
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
  { id: "p1", title: "راهنمای کامل اورکلاک Ryzen 7800X3D", author: "مهدی رستمی", category: "مونتاژ کیس", date: "۱۴۰۳/۰۲/۱۵", status: "pending" as const },
  { id: "p2", title: "بهترین SSD های NVMe در سال ۲۰۲۴", author: "فاطمه شریفی", category: "ذخیره‌سازی", date: "۱۴۰۳/۰۲/۱۵", status: "pending" as const },
  { id: "p3", title: "بیلد ۱۵۰ میلیونی برای گیمینگ ۴K", author: "بهزاد کاظمی", category: "ست‌آپ من", date: "۱۴۰۳/۰۲/۱۴", status: "approved" as const },
  { id: "p4", title: "تبلیغات اسپم - نادیده گرفته شود", author: "spammer123", category: "متفرقه", date: "۱۴۰۳/۰۲/۱۴", status: "rejected" as const },
  { id: "p5", title: "مشکل بوت ویندوز پس از نصب کارت گرافیک جدید", author: "علی محمدی", category: "عیب‌یابی", date: "۱۴۰۳/۰۲/۱۳", status: "pending" as const },
];
