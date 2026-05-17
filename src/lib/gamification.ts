import type { UserPointsEvent, UserProfile } from "./api";

type LevelTier = { level: number; minPoints: number; title: string };

const LEVEL_TIERS: LevelTier[] = [
  { level: 1, minPoints: 0, title: "تازه‌وارد" },
  { level: 2, minPoints: 30, title: "فعال" },
  { level: 3, minPoints: 80, title: "مشارکت‌کننده" },
  { level: 4, minPoints: 160, title: "یار انجمن" },
  { level: 5, minPoints: 280, title: "کارشناس" },
  { level: 6, minPoints: 450, title: "راهنما" },
  { level: 7, minPoints: 700, title: "قهرمان" },
  { level: 8, minPoints: 1000, title: "اسطوره" },
];

export type LevelProgress = {
  level: number;
  title: string;
  points: number;
  currentMinPoints: number;
  nextLevel: number | null;
  nextMinPoints: number | null;
  pointsToNext: number;
  progressPercent: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export function levelFromPoints(points: number): LevelProgress {
  const safe = Math.max(0, points || 0);
  let current = LEVEL_TIERS[0];
  let next: LevelTier | null = null;

  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    const tier = LEVEL_TIERS[i];
    const following = LEVEL_TIERS[i + 1] ?? null;
    if (safe >= tier.minPoints) {
      current = tier;
      next = following;
    } else {
      break;
    }
  }

  if (!next) {
    return {
      level: current.level,
      title: current.title,
      points: safe,
      currentMinPoints: current.minPoints,
      nextLevel: null,
      nextMinPoints: null,
      pointsToNext: 0,
      progressPercent: 100,
    };
  }

  const span = Math.max(1, next.minPoints - current.minPoints);
  const filled = Math.min(span, Math.max(0, safe - current.minPoints));
  return {
    level: current.level,
    title: current.title,
    points: safe,
    currentMinPoints: current.minPoints,
    nextLevel: next.level,
    nextMinPoints: next.minPoints,
    pointsToNext: Math.max(0, next.minPoints - safe),
    progressPercent: Math.round((filled / span) * 100),
  };
}

export function achievementsFromProfile(profile: UserProfile): Achievement[] {
  const b = profile.breakdown;
  return [
    {
      id: "first-thread",
      title: "شروع‌کننده",
      description: "اولین موضوع را ثبت کرد.",
      unlocked: b.threads >= 1,
    },
    {
      id: "topic-master",
      title: "موضوع‌ساز",
      description: "حداقل ۵ موضوع ثبت کرد.",
      unlocked: b.threads >= 5,
    },
    {
      id: "helpful",
      title: "پاسخ‌گو",
      description: "حداقل ۱۰ کامنت ارسال کرد.",
      unlocked: b.comments >= 10,
    },
    {
      id: "reactor",
      title: "پرتعامل",
      description: "حداقل ۲۰ واکنش ثبت کرد.",
      unlocked: b.reactions >= 20,
    },
    {
      id: "century",
      title: "۱۰۰ امتیازی",
      description: "به ۱۰۰ امتیاز رسید.",
      unlocked: profile.points >= 100,
    },
    {
      id: "elite",
      title: "نخبه",
      description: "به ۳۰۰ امتیاز رسید.",
      unlocked: profile.points >= 300,
    },
    {
      id: "all-rounder",
      title: "همه‌فن‌حریف",
      description: "حداقل ۳ موضوع، ۱۵ کامنت و ۱۰ واکنش ثبت کرد.",
      unlocked: b.threads >= 3 && b.comments >= 15 && b.reactions >= 10,
    },
  ];
}

function toDateKey(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function activityStreakFromEvents(events: UserPointsEvent[]): number {
  const keys = new Set<string>();
  for (const e of events) {
    const key = toDateKey(e.createdAt);
    if (key) keys.add(key);
  }
  if (keys.size === 0) return 0;

  let streak = 0;
  const now = new Date();
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Allow streak to start from yesterday if user has no activity today yet.
  const todayKey = `${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}`;
  if (!keys.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}`;
    if (!keys.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
