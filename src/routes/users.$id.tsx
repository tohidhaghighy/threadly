import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  ArrowRight,
  MessageCircle,
  Sparkles,
  PlusCircle,
  Flame,
  ShieldCheck,
  Rocket,
  FileText,
  HandHelping,
  Zap,
  Star,
  Gem,
  Layers,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { api, type UserPointsEvent, type UserProfile } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { buildSeo, useSeo } from "@/lib/seo";
import { achievementsFromProfile, activityStreakFromEvents, levelFromPoints } from "@/lib/gamification";

export const Route = createFileRoute("/users/$id")({
  head: ({ params }) => {
    const seo = buildSeo({
      title: "پروفایل کاربر",
      description: "پروفایل کاربر و امتیاز فعالیت.",
      path: `/users/${params.id}`,
      type: "profile",
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: UserProfilePage,
});

function UserProfilePage() {
  const { id } = Route.useParams();
  const auth = useAuth();

  const q = useQuery({
    queryKey: ["userProfile", id],
    queryFn: () => api<UserProfile>(`/api/users/${id}/profile`),
  });

  const eventsQ = useQuery({
    queryKey: ["userPointsEvents", id],
    queryFn: () => api<{ items: UserPointsEvent[]; nextCursor: string | null }>(`/api/users/${id}/points-events?limit=200`),
  });

  const u = q.data;
  const events = eventsQ.data?.items ?? [];
  const isMyProfile = !!auth.user && auth.user.id === id;
  const level = u ? levelFromPoints(u.points) : null;
  const streakDays = activityStreakFromEvents(events);
  const achievements = u ? achievementsFromProfile(u) : [];
  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;

  useSeo(
    u
      ? {
          title: `${u.name} — پروفایل کاربر`,
          description: `پروفایل ${u.name} در Threadly • امتیاز ${u.points} • رتبه ${u.rank} از ${u.totalUsers} • ${u.breakdown.threads} موضوع، ${u.breakdown.comments} کامنت، ${u.breakdown.reactions} واکنش.`,
          path: `/users/${id}`,
          type: "profile",
          image: u.avatarUrl ?? undefined,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: {
              "@type": "Person",
              name: u.name,
              image: u.avatarUrl ?? undefined,
            },
          },
        }
      : null,
  );

  if (q.isError) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
        <Link
          to="/users"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" /> بازگشت به رتبه‌بندی
        </Link>
        <div className="mt-4 rounded-2xl border border-border/60 bg-card p-6 text-center shadow-card">
          <p className="text-base font-extrabold">پروفایل پیدا نشد</p>
          <p className="mt-2 text-sm text-muted-foreground">
            این کاربر وجود ندارد یا بارگذاری پروفایل ناموفق بود.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
      <Link
        to="/users"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" /> بازگشت به رتبه‌بندی
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
        <div className="border-b border-border/60 bg-gradient-to-l from-primary/10 to-transparent p-6">
          {q.isLoading || !u ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-primary/30">
                {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.name} /> : null}
                <AvatarFallback className="bg-gradient-primary text-lg font-extrabold text-primary-foreground">
                  {(u.name[0] ?? "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold">{u.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  رتبه {u.rank.toLocaleString("fa-IR")} از {u.totalUsers.toLocaleString("fa-IR")} • امتیاز{" "}
                  <span className="font-extrabold text-primary">{u.points.toLocaleString("fa-IR")}</span>
                </p>
                {level ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge className="border border-primary/30 bg-primary/15 text-primary">
                      سطح {level.level} · {level.title}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Flame className="h-3.5 w-3.5 text-orange-500" />
                      {streakDays.toLocaleString("fa-IR")} روز فعالیت پیاپی
                    </Badge>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2">
                <span className="text-xs font-semibold text-muted-foreground">امتیاز</span>
                <span className="text-2xl font-extrabold text-primary">{u.points.toLocaleString("fa-IR")}</span>
              </div>
              <div className="ms-auto flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/threads">مشاهده گفتگوها</Link>
                </Button>
                {isMyProfile ? (
                  <Button asChild variant="hero" size="sm">
                    <Link to="/settings">ویرایش عکس</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {q.isLoading || !u ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              {level ? (
                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold">پیشرفت سطح</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {level.nextLevel
                          ? `${level.pointsToNext.toLocaleString("fa-IR")} امتیاز تا سطح ${level.nextLevel}`
                          : "بالاترین سطح را کسب کرده‌اید"}
                      </p>
                    </div>
                    <Badge variant="secondary">Lv {level.level}</Badge>
                  </div>
                  <Progress value={level.progressPercent} className="mt-3 h-2.5" />
                </div>
              ) : null}

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <StatCard label="موضوع‌ها" value={u.breakdown.threads} />
                <StatCard label="کامنت‌ها" value={u.breakdown.comments} />
                <StatCard label="واکنش‌ها" value={u.breakdown.reactions} icon={<Award className="h-4 w-4" />} />
              </div>
            </>
          )}

          <div className="mt-6 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            امتیاز: موضوع × ۱۰، کامنت × ۲، واکنش × ۱ (فقط فعالیت روی موضوعات تأیید شده محاسبه می‌شود)
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-card p-4 shadow-card">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold">چطور امتیاز بگیرم؟</p>
                <p className="text-xs text-muted-foreground">با این کارها سریع‌تر رتبه‌ات بالا می‌رود</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <EarnCard title="ایجاد موضوع" points="+۱۰" desc="هر موضوع تأیید شده ۱۰ امتیاز دارد." />
              <EarnCard title="ارسال کامنت" points="+۲" desc="هر کامنت روی موضوعات تأیید شده ۲ امتیاز دارد." />
              <EarnCard title="ثبت واکنش" points="+۱" desc="هر واکنش روی کامنت‌های موضوعات تأیید شده ۱ امتیاز دارد." />
            </div>
          </div>

          {q.isLoading || !u ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-border/60 bg-card p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold">نشان‌های افتخار</p>
                    <p className="text-xs text-muted-foreground">پاداش فعالیت مستمر و موثر در انجمن</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {unlockedAchievements.toLocaleString("fa-IR")} / {achievements.length.toLocaleString("fa-IR")}
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-xl border p-3 ${
                      a.unlocked
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-border/60 bg-muted/20 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/70">
                        <AchievementIcon id={a.id} />
                      </div>
                      {a.unlocked ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="mt-2 text-sm font-extrabold">{a.title}</p>
                    <p className="mt-1 text-xs">{a.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold">تاریخچه فعالیت‌ها (امتیازها)</p>
                  <p className="text-xs text-muted-foreground">لیست کارهایی که باعث گرفتن امتیاز شده</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {eventsQ.isLoading ? "..." : `${events.length.toLocaleString("fa-IR")} مورد`}
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-start">زمان</TableHead>
                  <TableHead className="text-start">عمل</TableHead>
                  <TableHead className="text-start">موضوع</TableHead>
                  <TableHead className="text-start">امتیاز</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsQ.isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      </TableRow>
                    ))
                  : events.map((e) => (
                      <TableRow key={e.id} className="hover:bg-muted/30">
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(e.createdAt).toLocaleString("fa-IR")}
                        </TableCell>
                        <TableCell>
                          <ActionBadge e={e} />
                        </TableCell>
                        <TableCell className="max-w-[28rem]">
                          {"thread" in e ? (
                            <Link
                              to="/threads/$id"
                              params={{ id: e.thread.id }}
                              className="line-clamp-1 text-sm font-semibold hover:underline"
                            >
                              {e.thread.title}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                          {e.type === "reply" ? (
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{e.reply.excerpt}</p>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-extrabold text-primary">
                          +{e.points.toLocaleString("fa-IR")}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>

            {!eventsQ.isLoading && events.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">هنوز فعالیت امتیازدار ثبت نشده</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBadge({ e }: { e: UserPointsEvent }) {
  if (e.type === "thread") {
    return (
      <Badge className="gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
        <PlusCircle className="h-3.5 w-3.5" /> ایجاد موضوع
      </Badge>
    );
  }
  if (e.type === "reply") {
    return (
      <Badge className="gap-1 bg-sky-500/10 text-sky-500 border border-sky-500/30">
        <MessageCircle className="h-3.5 w-3.5" /> ارسال کامنت
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/30">
      <span className="text-sm leading-none">{e.emoji}</span> واکنش
    </Badge>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-primary">{value.toLocaleString("fa-IR")}</p>
      <Badge variant="outline" className="mt-2 text-xs">
        فعالیت
      </Badge>
    </div>
  );
}

function EarnCard({ title, points, desc }: { title: string; points: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-extrabold">{title}</p>
        <Badge className="bg-primary/15 text-primary border border-primary/30">{points}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function AchievementIcon({ id }: { id: string }) {
  if (id === "first-thread") return <Rocket className="h-4 w-4" />;
  if (id === "topic-master") return <FileText className="h-4 w-4" />;
  if (id === "helpful") return <HandHelping className="h-4 w-4" />;
  if (id === "reactor") return <Zap className="h-4 w-4" />;
  if (id === "century") return <Star className="h-4 w-4" />;
  if (id === "elite") return <Gem className="h-4 w-4" />;
  if (id === "all-rounder") return <Layers className="h-4 w-4" />;
  return <Award className="h-4 w-4" />;
}

