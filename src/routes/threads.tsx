import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Filter, Inbox } from "lucide-react";
import { ThreadCard } from "@/components/ThreadCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ThreadCardSkeleton } from "@/components/skeletons/ThreadCardSkeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ReplyListItem, type ThreadDetail, type ThreadListItem } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCategories } from "@/lib/categories";

export const Route = createFileRoute("/threads")({
  head: () => ({
    meta: [
      { title: "گفتگوها — Threadly" },
      { name: "description", content: "مرور سوال‌ها و گفتگوهای تأیید شده در Threadly." },
    ],
  }),
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
  const [openId, setOpenId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const auth = useAuth();
  const qc = useQueryClient();
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

  const threadQuery = useQuery({
    queryKey: ["thread", openId],
    queryFn: () => api<ThreadDetail>(`/api/threads/${openId}`),
    enabled: !!openId,
  });

  const repliesQuery = useQuery({
    queryKey: ["replies", openId],
    queryFn: () => api<{ items: ReplyListItem[]; nextCursor: string | null }>(`/api/threads/${openId}/replies`),
    enabled: !!openId,
  });

  const postReply = useMutation({
    mutationFn: async () => {
      if (!openId) throw new Error("no thread");
      return api<{ id: string }>(`/api/threads/${openId}/replies`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ content: answer.trim() }),
      });
    },
    onSuccess: async () => {
      setAnswer("");
      toast.success("پاسخ ارسال شد");
      await qc.invalidateQueries({ queryKey: ["replies", openId] });
      await qc.invalidateQueries({ queryKey: ["thread", openId] });
      await qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const threads = useMemo(() => data?.items ?? [], [data?.items]);
  const cards = useMemo(
    () =>
      threads.map((t) => ({
        id: t.id,
        title: t.title,
        author: { name: t.author.displayName, avatar: (t.author.displayName[0] ?? "U").toUpperCase() },
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
            <p className="mt-1 text-sm text-muted-foreground">
              اولین نفری باشید که گفتگو را شروع می‌کند.
            </p>
            <Button variant="hero" className="mt-4">ایجاد موضوع</Button>
          </div>
        ) : (
          visible.map((t, idx) => (
            <div
              key={t.id}
              className="animate-in fade-in slide-in-from-bottom-1 duration-500"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <button
                type="button"
                className="w-full text-start"
                onClick={() => {
                  setOpenId(t.id);
                }}
              >
                <ThreadCard thread={t} />
              </button>
            </div>
          ))
        )}
      </div>

      <Dialog
        open={!!openId}
        onOpenChange={(v) => {
          if (!v) {
            setOpenId(null);
            setAnswer("");
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>پرسش و پاسخ</DialogTitle>
          </DialogHeader>

          {!openId || threadQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : threadQuery.isError ? (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              گفتگو پیدا نشد یا هنوز تأیید نشده است.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {threadQuery.data.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(threadQuery.data.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold">{threadQuery.data.title}</h2>
                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">{threadQuery.data.content}</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-extrabold">
                  {threadQuery.data.counts.repliesCount.toLocaleString("fa-IR")} پاسخ
                </h3>

                {(threadQuery.data.attachments ?? []).length ? (
                  <div className="rounded-xl border border-border/60 bg-card p-4">
                    <p className="text-sm font-semibold">تصاویر</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {threadQuery.data.attachments.map((a) => (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative overflow-hidden rounded-lg border border-border/60 bg-muted/20"
                          title="باز کردن تصویر"
                        >
                          <img
                            src={a.url}
                            alt="تصویر ضمیمه"
                            className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {repliesQuery.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (repliesQuery.data?.items ?? []).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    هنوز پاسخی ثبت نشده است.
                  </div>
                ) : (
                  <div className="max-h-[40vh] space-y-3 overflow-auto pe-2">
                    {(repliesQuery.data?.items ?? []).map((r) => (
                      <div key={r.id} className="rounded-xl border border-border/60 bg-card p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">{r.author.displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="mb-2 text-sm font-semibold">پاسخ شما</p>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={auth.token ? "پاسخ خود را بنویسید..." : "برای ارسال پاسخ وارد شوید."}
                  disabled={!auth.token || postReply.isPending}
                  className="min-h-28 bg-muted/20"
                />
                <div className="mt-3 flex items-center justify-end">
                  <Button
                    variant="hero"
                    size="sm"
                    disabled={!auth.token || !answer.trim() || postReply.isPending}
                    onClick={() => postReply.mutate()}
                  >
                    ارسال پاسخ
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
