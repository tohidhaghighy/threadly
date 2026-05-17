import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Filter, Inbox } from "lucide-react";
import { ThreadCard } from "@/components/ThreadCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ThreadCardSkeleton } from "@/components/skeletons/ThreadCardSkeleton";
import { useQuery } from "@tanstack/react-query";
import { api, type ThreadListItem } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useCategories } from "@/lib/categories";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/threads/")({
  head: () => {
    const seo = buildSeo({
      title: "گفتگوها",
      description: "مرور سوال‌ها و گفتگوهای تأیید شده در انجمن فاطر.",
      path: "/threads",
    });
    return { meta: seo.meta, links: seo.links };
  },
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    category: typeof search.category === "string" ? search.category : "",
  }),
  component: ThreadsPage,
});

const filters = ["جدیدترین", "محبوب‌ترین", "بدون پاسخ", "حل‌شده"];

function ThreadsPage() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [activeFilter, setActiveFilter] = useState("جدیدترین");
  const [activeCat, setActiveCat] = useState<string | null>(search.category ? search.category : null);
  const [loading, setLoading] = useState(true);
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data?.items ?? [];

  useEffect(() => {
    setQ(search.q ?? "");
    setActiveCat(search.category ? search.category : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.q, search.category]);

  const { data } = useQuery({
    queryKey: ["threads", { activeFilter, activeCat, q }],
    queryFn: async () => {
      const sort = activeFilter === "محبوب‌ترین" ? "top" : activeFilter === "جدیدترین" ? "new" : "new";
      const qs = new URLSearchParams();
      if (activeCat) qs.set("category", activeCat);
      if (q.trim()) qs.set("q", q.trim());
      qs.set("sort", sort);
      return api<{ items: ThreadListItem[]; nextCursor: string | null }>(`/api/threads?${qs.toString()}`);
    },
  });

  const threads = useMemo(() => data?.items ?? [], [data?.items]);
  const cards = useMemo(
    () =>
      threads.map((t) => ({
        id: t.id,
        title: t.title,
        author: {
          name: t.author.displayName,
          avatar: (t.author.displayName[0] ?? "U").toUpperCase(),
          avatarUrl: t.author.avatarUrl,
        },
        category: t.category,
        tags: t.tags ?? [],
        replies: t.counts.repliesCount,
        views: t.counts.viewsCount,
        likes: t.counts.likesCount,
        time: formatDistanceToNow(new Date(t.createdAt), { addSuffix: true }),
        excerpt: t.excerpt,
      })),
    [threads],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  const visible = cards;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <AnimatedSection className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">همه گفتگوها</h1>
        <p className="text-sm text-muted-foreground">
          {threads.length} موضوع فعال در {categories.length} دسته
        </p>
      </AnimatedSection>

      <AnimatedSection className="mt-6">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجو در همه گفتگوها..."
          className="h-11 border-border/70 bg-background/70 shadow-sm"
        />
      </AnimatedSection>

      <AnimatedSection className="mt-6 flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <Button
            key={f}
            variant={activeFilter === f ? "hero" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </Button>
        ))}
        <div className="ms-auto">
          <Button variant="ghost" size="sm">
            <Filter className="h-4 w-4" /> پیشرفته
          </Button>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mt-4 flex flex-wrap gap-2" delayMs={60}>
        <Badge
          onClick={() => setActiveCat(null)}
          className={`cursor-pointer ${!activeCat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          همه
        </Badge>
        {categories.map((c) => (
          <Badge
            key={c.id}
            onClick={() => setActiveCat(c.title)}
            className={`cursor-pointer ${activeCat === c.title ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
          >
            {c.title}
          </Badge>
        ))}
      </AnimatedSection>

      <div className="mt-6 space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <ThreadCardSkeleton
              key={i}
              className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-border/60 bg-card p-5 duration-500"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-bold">هنوز موضوعی نیست</h3>
            <p className="mt-1 text-sm text-muted-foreground">اولین نفری باشید که گفتگو را شروع می‌کند.</p>
            <Button asChild variant="hero" className="mt-4">
              <Link to="/new" search={activeCat ? { category: activeCat } : undefined}>
                ایجاد موضوع
              </Link>
            </Button>
          </div>
        ) : (
          visible.map((t, idx) => (
            <div
              key={t.id}
              className="animate-in fade-in slide-in-from-bottom-1 duration-500"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <Link to="/threads/$id" params={{ id: t.id }} hash="replies" className="block">
                <ThreadCard thread={t} />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

