import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2, Flag, ArrowRight, Image as ImageIcon, Code2, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ReplyListItem, type ThreadDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/threads/$id")({
  head: () => ({
    meta: [
      { title: "گفتگو — Threadly" },
      { name: "description", content: "مشاهده و ارسال پاسخ برای گفتگوهای Threadly." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">{error.message}</div>,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <p>این گفتگو پیدا نشد.</p>
      <Link to="/threads" className="text-primary underline">بازگشت</Link>
    </div>
  ),
  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const auth = useAuth();
  const qc = useQueryClient();

  const threadQuery = useQuery({
    queryKey: ["thread", id],
    queryFn: () => api<ThreadDetail>(`/api/threads/${id}`),
  });

  const repliesQuery = useQuery({
    queryKey: ["replies", id],
    queryFn: () => api<{ items: ReplyListItem[]; nextCursor: string | null }>(`/api/threads/${id}/replies`),
    enabled: threadQuery.isSuccess,
  });

  const thread = threadQuery.data;
  const replies = repliesQuery.data?.items ?? [];

  const headerModel = useMemo(() => {
    if (!thread) return null;
    return {
      category: thread.category,
      tags: thread.tags ?? [],
      title: thread.title,
      author: {
        name: thread.author.displayName,
        avatar: (thread.author.displayName[0] ?? "U").toUpperCase(),
      },
      time: formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true }),
      views: thread.counts.viewsCount,
      likes: thread.counts.likesCount,
      replies: thread.counts.repliesCount,
      excerpt: thread.excerpt,
      content: thread.content,
      attachments: thread.attachments ?? [],
    };
  }, [thread]);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(t);
  }, []);

  if (threadQuery.isError) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
        <p className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          این گفتگو یافت نشد یا هنوز تأیید نشده است.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <Link to="/threads" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4" /> بازگشت به گفتگوها
      </Link>

      <article className="mt-4 animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card duration-500">
        <div className="border-b border-border/60 bg-gradient-to-l from-primary/10 to-transparent p-6">
          {loading || !headerModel ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
              <Skeleton className="h-8 w-11/12" />
              <Skeleton className="h-8 w-3/4" />
              <div className="mt-4 flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary">
                  {headerModel.category}
                </Badge>
                {headerModel.tags.map((t: string) => (
                  <span key={t} className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    #{t}
                  </span>
                ))}
              </div>
              <h1 className="mt-4 text-2xl font-extrabold leading-relaxed md:text-3xl">{headerModel.title}</h1>

              <div className="mt-4 flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-primary/40">
                  <AvatarFallback className="bg-gradient-primary font-bold text-primary-foreground">
                    {headerModel.author.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{headerModel.author.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {headerModel.time} • {headerModel.views.toLocaleString("fa-IR")} بازدید
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4 p-6 text-base leading-relaxed text-foreground/90">
          <p>{headerModel?.excerpt}</p>
          {headerModel?.content ? <p className="whitespace-pre-wrap">{headerModel.content}</p> : null}

          {headerModel?.attachments && headerModel.attachments.length > 0 ? (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
              <p className="mb-3 text-xs font-semibold text-muted-foreground">Attached images</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {headerModel.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/70 px-3 py-2 hover:border-primary/40"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span className="min-w-0 truncate text-sm font-medium">{a.url.split("/").pop()}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{(a.sizeBytes / 1024).toFixed(0)} KB</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-6 py-4">
          <Button variant="glow" size="sm"><Heart className="h-4 w-4" /> {headerModel?.likes ?? 0}</Button>
          <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4" /> {headerModel?.replies ?? 0} پاسخ</Button>
          <Button variant="ghost" size="sm"><Share2 className="h-4 w-4" /> اشتراک‌گذاری</Button>
          <Button variant="ghost" size="sm" className="ms-auto text-muted-foreground"><Flag className="h-4 w-4" /> گزارش</Button>
        </div>
      </article>

      <section id="replies" className="mt-8 scroll-mt-24">
        <h2 className="text-xl font-extrabold">{headerModel?.replies ?? replies.length} پاسخ</h2>
        <div className="mt-4 space-y-4">
          {replies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/50 p-8 text-center">
              <p className="text-sm font-semibold">هنوز پاسخی ثبت نشده</p>
              <p className="mt-1 text-sm text-muted-foreground">
                اولین نفری باشید که پاسخ می‌دهد.
              </p>
            </div>
          ) : null}
          {replies.map((r) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-card p-5 shadow-card">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-border">
        <AvatarFallback className="bg-secondary text-sm font-bold">
          {(r.author.displayName[0] ?? "ک").toUpperCase()}
        </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{r.author.displayName}</span>
                    <span className="text-xs text-muted-foreground">
                      • {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">{r.content}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                      <Heart className="h-3.5 w-3.5" /> {r.likesCount}
                    </button>
                    <button className="text-muted-foreground hover:text-primary">پاسخ</button>
                    <Separator orientation="vertical" className="h-3" />
                    <button className="text-muted-foreground hover:text-primary">اشتراک‌گذاری</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border/60 bg-card p-4 shadow-card">
          <p className="mb-3 text-sm font-semibold">پاسخ شما</p>
          <Textarea
            placeholder="پاسخ خود را بنویسید..."
            className="min-h-32 resize-none bg-muted/30"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1">
              <Button variant="ghost" size="icon"><ImageIcon className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon"><Code2 className="h-4 w-4" /></Button>
            </div>
            <Button
              variant="hero"
              size="sm"
              disabled={!auth.token || !thread || repliesQuery.isFetching}
              onClick={async () => {
                const body = answer.trim();
                if (!body) return;
                if (!thread) return;
                await api<{ id: string }>(`/api/threads/${thread.id}/replies`, {
                  method: "POST",
                  auth: true,
                  body: JSON.stringify({ content: body }),
                });
                setAnswer("");
                toast.success("پاسخ ارسال شد");
                await qc.invalidateQueries({ queryKey: ["replies", id] });
                await qc.invalidateQueries({ queryKey: ["thread", id] });
              }}
            >
              <Send className="h-4 w-4" /> ارسال پاسخ
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
