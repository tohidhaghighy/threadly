import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, Sparkles, ArrowLeft, Filter } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categories as mockCategories } from "@/lib/mock-data";
import { ThreadCard } from "@/components/ThreadCard";
import { AnimatedSection } from "@/components/AnimatedSection";
import { CategoryCardSkeleton } from "@/components/skeletons/CategoryCardSkeleton";
import { ThreadCardSkeleton } from "@/components/skeletons/ThreadCardSkeleton";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api, type ThreadListItem } from "@/lib/api";
import { useCategories } from "@/lib/categories";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => {
    const seo = buildSeo({
      titleAbsolute: "Threadly — انجمن ساخت کیس",
      description:
        "در Threadly سوال بپرسید، تجربه و اسمبل خود را به اشتراک بگذارید و پاسخ بگیرید.",
      path: "/",
      type: "website",
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: Index,
});

function Index() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: () =>
      api<{ approvedThreadsCount: number; usersCount: number; responseRatePercent: number }>("/api/stats"),
  });

  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data?.items ?? [];
  const mockByTitle = new Map(mockCategories.map((c) => [c.title, c]));

  const newestQuery = useInfiniteQuery({
    queryKey: ["home", "newest"],
    initialPageParam: "0" as string,
    queryFn: ({ pageParam }) =>
      api<{ items: ThreadListItem[]; nextCursor: string | null }>(`/api/threads?sort=new&limit=6&cursor=${pageParam}`),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const searchQuery = useQuery({
    queryKey: ["home", "search", search.trim()],
    queryFn: async () => {
      const q = search.trim();
      if (!q) return { items: [] as ThreadListItem[], nextCursor: null as string | null };
      const qs = new URLSearchParams();
      qs.set("q", q);
      qs.set("sort", "new");
      qs.set("limit", "8");
      return api<{ items: ThreadListItem[]; nextCursor: string | null }>(`/api/threads?${qs.toString()}`);
    },
  });
  const hotQuery = useQuery({
    queryKey: ["home", "top"],
    queryFn: () => api<{ items: ThreadListItem[]; nextCursor: string | null }>("/api/threads?sort=top"),
  });
  const viewsQuery = useQuery({
    queryKey: ["home", "views"],
    queryFn: () => api<{ items: ThreadListItem[]; nextCursor: string | null }>("/api/threads?sort=hot"),
  });
  const repliesQuery = useQuery({
    queryKey: ["home", "replies"],
    queryFn: () => api<{ items: ThreadListItem[]; nextCursor: string | null }>("/api/threads?sort=replies"),
  });

  const mapToCard = (t: ThreadListItem) => ({
    id: t.id,
    title: t.title,
    author: {
      name: t.author.displayName,
      avatar: (t.author.displayName[0] ?? "ک").toUpperCase(),
      avatarUrl: t.author.avatarUrl,
    },
    category: t.category,
    tags: t.tags ?? [],
    replies: t.counts.repliesCount,
    views: t.counts.viewsCount,
    likes: t.counts.likesCount,
    time: new Date(t.createdAt).toLocaleDateString("fa-IR"),
    excerpt: t.excerpt,
    pinned: false,
    hot: false,
  });

  const newest = useMemo(
    () => (newestQuery.data?.pages.flatMap((p) => p.items) ?? []).map(mapToCard),
    [newestQuery.data?.pages],
  );
  const hottest = useMemo(() => (hotQuery.data?.items ?? []).slice(0, 4).map(mapToCard), [hotQuery.data?.items]);
  const mostViewed = useMemo(() => (viewsQuery.data?.items ?? []).slice(0, 4).map(mapToCard), [viewsQuery.data?.items]);
  const mostReplied = useMemo(() => (repliesQuery.data?.items ?? []).slice(0, 4).map(mapToCard), [repliesQuery.data?.items]);

  const newestSentinelRef = React.useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = newestSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (newestQuery.hasNextPage && !newestQuery.isFetchingNextPage) {
          void newestQuery.fetchNextPage();
        }
      },
      { rootMargin: "800px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [newestQuery.hasNextPage, newestQuery.isFetchingNextPage, newestQuery.fetchNextPage]);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <AnimatedSection className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-card md:p-12">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="absolute -end-20 -top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative">
          {loading ? (
            <div className="space-y-5">
              <Skeleton className="h-6 w-44 rounded-full" />
              <Skeleton className="h-10 w-4/5" />
              <Skeleton className="h-10 w-3/5" />
              <Skeleton className="h-5 w-11/12 max-w-2xl" />
              <div className="mt-6 flex flex-wrap gap-3">
                <Skeleton className="h-12 w-32 rounded-xl" />
                <Skeleton className="h-12 w-32 rounded-xl" />
              </div>
              <div className="mt-8 flex flex-wrap gap-6">
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            </div>
          ) : (
            <>
              <Badge className="bg-primary/20 text-primary border border-primary/30">
                <Sparkles className="me-1 h-3 w-3" /> انجمن رسمی Threadly
              </Badge>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
                هر آنچه برای ساختن <span className="text-gradient-primary">کیس رویایی</span> نیاز دارید
              </h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
                از انتخاب قطعات و اسمبل تا عیب‌یابی و بهینه‌سازی عملکرد—به جامعه‌ای از بیلدرها بپیوندید که به هم کمک می‌کنند.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="hero" size="lg">
                  <Link to="/new">ثبت سؤال</Link>
                </Button>
                <Button asChild variant="glow" size="lg">
                  <Link to="/threads">مرور گفتگوها</Link>
                </Button>
              </div>

              <div className="mt-6 max-w-2xl">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجو در همه گفتگوها..."
                  className="h-12 border-border/70 bg-background/70 shadow-sm"
                />
                {search.trim() ? (
                  <div className="mt-3 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-card">
                    {searchQuery.isLoading ? (
                      <div className="grid gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-14 w-full rounded-xl" />
                        ))}
                      </div>
                    ) : searchQuery.data?.items?.length ? (
                      <div className="grid gap-2">
                        {searchQuery.data.items.slice(0, 6).map((t) => (
                          <Link
                            key={t.id}
                            to="/threads"
                            search={{ q: search.trim() }}
                            className="rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-sm transition-colors hover:bg-background"
                          >
                            <div className="font-bold">{t.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {t.category} · {t.author.displayName}
                            </div>
                          </Link>
                        ))}
                        <div className="pt-1">
                          <Button asChild variant="outline" size="sm">
                            <Link to="/threads" search={{ q: search.trim() }}>
                              مشاهده نتایج بیشتر
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">نتیجه‌ای پیدا نشد.</div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-2xl font-extrabold text-gradient-primary">
                    {(statsQuery.data?.approvedThreadsCount ?? 0).toLocaleString("fa-IR")}
                  </span>
                  <span className="ms-2 text-muted-foreground">گفتگو</span>
                </div>
                <div>
                  <span className="text-2xl font-extrabold text-gradient-primary">
                    {(statsQuery.data?.usersCount ?? 0).toLocaleString("fa-IR")}
                  </span>
                  <span className="ms-2 text-muted-foreground">عضو</span>
                </div>
                <div>
                  <span className="text-2xl font-extrabold text-gradient-primary">
                    {(statsQuery.data?.responseRatePercent ?? 0).toLocaleString("fa-IR")}%
                  </span>
                  <span className="ms-2 text-muted-foreground">نرخ پاسخ‌گویی</span>
                </div>
              </div>
            </>
          )}
        </div>
      </AnimatedSection>

      <AnimatedSection className="mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">دسته‌بندی‌ها</h2>
            <p className="mt-1 text-sm text-muted-foreground">برای شروع یک موضوع انتخاب کنید</p>
          </div>
          <Link to="/threads" className="text-sm font-medium text-primary hover:underline">
            مشاهده همه <ArrowLeft className="inline h-3 w-3" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <CategoryCardSkeleton
                  key={i}
                  className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-border/60 bg-card p-6 shadow-card duration-500"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))
            : categories.map((cat, i) => {
                const mock = mockByTitle.get(cat.title);
                const Icon = mock?.icon;
                const color = mock?.color ?? "from-orange-500/20 to-amber-500/10";
                const description = cat.description ?? mock?.description ?? "";
                return (
                <Link
                  key={cat.id}
                  to="/threads"
                  search={{ category: cat.title }}
                  className="group relative animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-card duration-500 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${color} opacity-50 transition-opacity group-hover:opacity-100`}
                  />
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                      {Icon ? <Icon className="h-6 w-6" /> : null}
                    </div>
                    <h3 className="mt-4 text-lg font-bold">{cat.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {cat.threadsCount.toLocaleString("fa-IR")} گفتگو
                      </span>
                      <ArrowLeft className="h-4 w-4 text-primary transition-transform group-hover:-translate-x-1" />
                    </div>
                  </div>
                </Link>
                );
              })}
        </div>
      </AnimatedSection>

      <AnimatedSection className="mt-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">موضوعات</h2>
              <p className="text-sm text-muted-foreground">جدیدترین‌ها و محبوب‌ترین‌ها</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/threads">
              <Filter className="h-4 w-4" />
              مشاهده همه
            </Link>
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5 shadow-card">
          <Tabs defaultValue="newest" dir="rtl">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="newest">جدیدترین</TabsTrigger>
              <TabsTrigger value="mostReplied">بیشترین پاسخ</TabsTrigger>
              <TabsTrigger value="mostViewed">پربازدیدترین</TabsTrigger>
              <TabsTrigger value="hot">داغ</TabsTrigger>
            </TabsList>

            <TabsContent value="newest">
              <div className="mt-3 space-y-4">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <ThreadCardSkeleton
                        key={i}
                        className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-border/60 bg-card p-5 duration-500"
                        style={{ animationDelay: `${i * 60}ms` }}
                      />
                    ))
                  : newest.map((t) => (
                      <Link key={t.id} to="/threads/$id" params={{ id: t.id }} hash="replies" className="block">
                        <ThreadCard thread={t} />
                      </Link>
                    ))}

                <div ref={newestSentinelRef} />
                {newestQuery.isFetchingNextPage ? (
                  <ThreadCardSkeleton className="rounded-xl border border-border/60 bg-card p-5" />
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="mostReplied">
              <div className="mt-3 space-y-4">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <ThreadCardSkeleton
                        key={i}
                        className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-border/60 bg-card p-5 duration-500"
                        style={{ animationDelay: `${i * 60}ms` }}
                      />
                    ))
                  : mostReplied.map((t) => (
                      <Link key={t.id} to="/threads/$id" params={{ id: t.id }} hash="replies" className="block">
                        <ThreadCard thread={t} />
                      </Link>
                    ))}
              </div>
            </TabsContent>

            <TabsContent value="mostViewed">
              <div className="mt-3 space-y-4">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <ThreadCardSkeleton
                        key={i}
                        className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-border/60 bg-card p-5 duration-500"
                        style={{ animationDelay: `${i * 60}ms` }}
                      />
                    ))
                  : mostViewed.map((t) => (
                      <Link key={t.id} to="/threads/$id" params={{ id: t.id }} hash="replies" className="block">
                        <ThreadCard thread={t} />
                      </Link>
                    ))}
              </div>
            </TabsContent>

            <TabsContent value="hot">
              <div className="mt-3 space-y-4">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <ThreadCardSkeleton
                        key={i}
                        className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-border/60 bg-card p-5 duration-500"
                        style={{ animationDelay: `${i * 60}ms` }}
                      />
                    ))
                  : hottest.map((t) => (
                      <Link key={t.id} to="/threads/$id" params={{ id: t.id }} hash="replies" className="block">
                        <ThreadCard thread={t} />
                      </Link>
                    ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AnimatedSection>
    </div>
  );
}
