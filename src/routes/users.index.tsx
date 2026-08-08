import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Trophy } from "lucide-react";
import { levelFromPoints } from "@/lib/gamification";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildSeo } from "@/lib/seo";
import { PAGE_SEO_KEYS, useStaticPageSeo } from "@/lib/page-seo";
import { useUsersLeaderboard } from "@/hooks/api";

export const Route = createFileRoute("/users/")({
  head: () => {
    const seo = buildSeo({
      title: "رتبه‌بندی کاربران",
      description: "رتبه‌بندی کاربران بر اساس فعالیت: موضوع، کامنت و واکنش.",
      path: "/users",
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: UsersLeaderboardPage,
});

function RankCell({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2 py-1">
        <Crown className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-extrabold text-amber-500">King</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-300/40 bg-slate-100/10 px-2 py-1">
        <Crown className="h-4 w-4 text-slate-300" />
        <span className="text-xs font-extrabold text-slate-200">Queen</span>
      </div>
    );
  }
  return <span className="font-extrabold">{rank.toLocaleString("fa-IR")}</span>;
}

function UsersLeaderboardPage() {
  useStaticPageSeo(PAGE_SEO_KEYS.users, {
    title: "رتبه‌بندی کاربران",
    description: "رتبه‌بندی کاربران بر اساس فعالیت: موضوع، کامنت و واکنش.",
    path: "/users",
  });
  const q = useUsersLeaderboard();
  const items = q.data?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-4 sm:py-8 md:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Trophy className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold sm:text-3xl">رتبه‌بندی کاربران</h1>
          <p className="text-sm text-muted-foreground">امتیاز: موضوع × ۲، کامنت × ۲، واکنش × ۱</p>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 space-y-3 md:hidden">
        {q.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            ))
          : items.map((u) => {
              const level = levelFromPoints(u.points);
              return (
                <Link
                  key={u.id}
                  to="/users/$id"
                  params={{ id: u.id }}
                  className="block rounded-2xl border border-border/60 bg-card p-4 shadow-card transition hover:border-primary/40"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11 shrink-0 ring-2 ring-border">
                      <AvatarFallback className="bg-gradient-primary font-bold text-primary-foreground">
                        {(u.name[0] ?? "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <RankCell rank={u.rank} />
                        <span className="truncate font-semibold">{u.name}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          Lv {level.level} · {level.title}
                        </Badge>
                        <span className="text-sm font-extrabold text-primary">
                          {u.points.toLocaleString("fa-IR")} امتیاز
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          موضوع: {u.breakdown.threads.toLocaleString("fa-IR")}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          کامنت: {u.breakdown.comments.toLocaleString("fa-IR")}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          واکنش: {u.breakdown.reactions.toLocaleString("fa-IR")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
        {!q.isLoading && items.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card py-12 text-center text-sm text-muted-foreground">
            کاربری یافت نشد
          </div>
        ) : null}
      </div>

      {/* Desktop table */}
      <div className="mt-6 hidden overflow-hidden rounded-xl border border-border/60 bg-card shadow-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-start">رتبه</TableHead>
              <TableHead className="text-start">کاربر</TableHead>
              <TableHead className="text-start">سطح</TableHead>
              <TableHead className="text-start">امتیاز</TableHead>
              <TableHead className="text-start">جزئیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-56" />
                    </TableCell>
                  </TableRow>
                ))
              : items.map((u) => {
                  const level = levelFromPoints(u.points);
                  return (
                    <TableRow key={u.id} className="hover:bg-muted/30">
                      <TableCell>
                        <RankCell rank={u.rank} />
                      </TableCell>
                      <TableCell>
                        <Link to="/users/$id" params={{ id: u.id }} className="flex items-center gap-3 hover:underline">
                          <Avatar className="h-9 w-9 ring-2 ring-border">
                            <AvatarFallback className="bg-gradient-primary font-bold text-primary-foreground">
                              {(u.name[0] ?? "U").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">{u.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          Lv {level.level} · {level.title}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-extrabold text-primary">
                        {u.points.toLocaleString("fa-IR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">موضوع: {u.breakdown.threads.toLocaleString("fa-IR")}</Badge>
                          <Badge variant="outline">کامنت: {u.breakdown.comments.toLocaleString("fa-IR")}</Badge>
                          <Badge variant="outline">واکنش: {u.breakdown.reactions.toLocaleString("fa-IR")}</Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
        {!q.isLoading && items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">کاربری یافت نشد</div>
        ) : null}
      </div>
    </div>
  );
}
