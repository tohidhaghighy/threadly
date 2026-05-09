import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, Heart, MessageCircle, Share2, Flag, ArrowRight, Image as ImageIcon, Code2, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ReplyActions } from "@/components/ReplyActions";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ReplyListItem, type ThreadDetail } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { buildSeo, useSeo } from "@/lib/seo";

export const Route = createFileRoute("/threads/$id")({
  head: ({ params }) => {
    const seo = buildSeo({
      title: "گفتگو",
      description: "مشاهده و ارسال پاسخ برای گفتگوهای Threadly.",
      path: `/threads/${params.id}`,
      type: "article",
    });
    return { meta: seo.meta, links: seo.links };
  },
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
  const [likeBusy, setLikeBusy] = useState(false);
  const [replyImages, setReplyImages] = useState<File[]>([]);
  const [shareBusy, setShareBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const auth = useAuth();
  const qc = useQueryClient();

  const replyImagePreviews = useMemo(
    () => replyImages.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [replyImages],
  );

  useEffect(() => {
    return () => {
      for (const it of replyImagePreviews) URL.revokeObjectURL(it.url);
    };
  }, [replyImagePreviews]);

  const threadQuery = useQuery({
    queryKey: ["thread", id],
    queryFn: () =>
      api<ThreadDetail>(`/api/threads/${id}`, {
        authOptional: true,
      }),
  });

  const repliesQuery = useQuery({
    queryKey: ["replies", id],
    queryFn: () =>
      api<{ items: ReplyListItem[]; nextCursor: string | null }>(`/api/threads/${id}/replies`, {
        authOptional: true,
      }),
    enabled: threadQuery.isSuccess,
  });

  const thread = threadQuery.data;
  const replies = repliesQuery.data?.items ?? [];

  const firstImageAttachment = thread?.attachments?.find((a) => a.mimeType.startsWith("image/"))?.url;
  useSeo(
    thread
      ? {
          title: thread.title,
          description: thread.excerpt ?? thread.content?.slice(0, 160),
          path: `/threads/${thread.id}`,
          type: "article",
          image: firstImageAttachment,
          publishedTime: thread.createdAt,
          author: thread.author.displayName,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "DiscussionForumPosting",
            headline: thread.title,
            articleBody: thread.content ?? thread.excerpt ?? "",
            datePublished: thread.createdAt,
            author: {
              "@type": "Person",
              name: thread.author.displayName,
            },
            interactionStatistic: [
              {
                "@type": "InteractionCounter",
                interactionType: "https://schema.org/LikeAction",
                userInteractionCount: thread.counts.likesCount,
              },
              {
                "@type": "InteractionCounter",
                interactionType: "https://schema.org/CommentAction",
                userInteractionCount: thread.counts.repliesCount,
              },
              {
                "@type": "InteractionCounter",
                interactionType: "https://schema.org/ViewAction",
                userInteractionCount: thread.counts.viewsCount,
              },
            ],
            keywords: (thread.tags ?? []).join(", "),
          },
        }
      : null,
  );

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
      likedByMe: thread.likedByMe,
      replies: thread.counts.repliesCount,
      excerpt: thread.excerpt,
      content: thread.content,
      attachments: thread.attachments ?? [],
    };
  }, [thread]);

  useEffect(() => {
    // count a view after the thread is opened (auth-aware, de-duped per user on backend)
    void api<{ viewsCount: number }>(`/api/threads/${id}/view`, {
      method: "POST",
      authOptional: true,
    })
      .then(async () => {
        await qc.invalidateQueries({ queryKey: ["thread", id] });
        await qc.invalidateQueries({ queryKey: ["threads"] });
      })
      .catch(() => {});
  }, [id, qc]);

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
                  {thread?.author.avatarUrl ? <AvatarImage src={thread.author.avatarUrl} alt={thread.author.displayName} /> : null}
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
          {headerModel?.content ? <p className="whitespace-pre-wrap">{headerModel.content}</p> : null}

          {headerModel?.attachments && headerModel.attachments.length > 0 ? (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
              <p className="mb-3 text-xs font-semibold text-muted-foreground">تصاویر پیوست</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {headerModel.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative overflow-hidden rounded-lg border border-border/60 bg-background/60"
                    title="باز کردن تصویر"
                  >
                    <img
                      src={a.url}
                      alt="تصویر پیوست"
                      className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                    <div className="pointer-events-none absolute bottom-1 end-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                      {(a.sizeBytes / 1024).toFixed(0)} KB
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-6 py-4">
          <Button
            variant="glow"
            size="sm"
            disabled={!auth.token || likeBusy || !thread}
            onClick={async () => {
              if (!auth.token) {
                toast.error("برای لایک باید وارد شوید.");
                return;
              }
              if (!thread) return;
              setLikeBusy(true);
              try {
                await api<{ likesCount: number; likedByMe: boolean }>(`/api/threads/${thread.id}/like`, {
                  method: "POST",
                  auth: true,
                });
                await qc.invalidateQueries({ queryKey: ["thread", id] });
                await qc.invalidateQueries({ queryKey: ["threads"] });
              } catch {
                toast.error("عملیات انجام نشد. دوباره تلاش کنید.");
              } finally {
                setLikeBusy(false);
              }
            }}
          >
            <Heart className={`h-4 w-4 ${headerModel?.likedByMe ? "fill-current" : ""}`} /> {headerModel?.likes ?? 0}
          </Button>
          <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4" /> {headerModel?.replies ?? 0} پاسخ</Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={shareBusy || !thread}
            onClick={async () => {
              if (!thread) return;
              setShareBusy(true);
              try {
                const url = `${window.location.origin}/threads/${thread.id}#replies`;
                const title = thread.title;

                // Prefer native share when available (mobile).
                if (typeof navigator !== "undefined" && "share" in navigator) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (navigator as any).share({ title, url });
                  toast.success("لینک گفتگو به اشتراک گذاشته شد");
                  return;
                }

                if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                  await navigator.clipboard.writeText(url);
                  toast.success("لینک کپی شد");
                  return;
                }

                // Fallback
                const ta = document.createElement("textarea");
                ta.value = url;
                ta.style.position = "fixed";
                ta.style.top = "-9999px";
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                const ok = document.execCommand("copy");
                document.body.removeChild(ta);
                if (ok) toast.success("لینک کپی شد");
                else toast.error("کپی لینک ناموفق بود");
              } catch {
                toast.error("اشتراک‌گذاری انجام نشد");
              } finally {
                setShareBusy(false);
              }
            }}
          >
            <Share2 className="h-4 w-4" /> اشتراک‌گذاری
          </Button>
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
        {r.author.avatarUrl ? <AvatarImage src={r.author.avatarUrl} alt={r.author.displayName} /> : null}
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
                  {(r.attachments ?? []).length ? (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {r.attachments.map((a) => (
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
                            className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  ) : null}
                  <ReplyActions reply={r} threadId={id} />
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
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              const onlyImages = files.filter((f) => f.type.startsWith("image/"));
              if (onlyImages.length !== files.length) toast.error("فقط فایل تصویری مجاز است.");
              setReplyImages((prev) => [...prev, ...onlyImages]);
              e.currentTarget.value = "";
            }}
          />
          {replyImages.length ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {replyImagePreviews.map(({ file: f, url }) => {
                return (
                  <button
                    key={`${f.name}-${f.size}-${f.lastModified}`}
                    type="button"
                    className="group relative overflow-hidden rounded-lg border border-border/60 bg-muted/20"
                    title="حذف تصویر"
                    onClick={() => {
                      URL.revokeObjectURL(url);
                      setReplyImages((prev) => prev.filter((x) => x !== f));
                    }}
                  >
                    <img src={url} alt={f.name} className="h-20 w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 transition group-hover:opacity-100" />
                    <span className="absolute bottom-1 end-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                      حذف
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileRef.current?.click()}
                disabled={!auth.token}
                title={auth.token ? "افزودن تصویر" : "برای ارسال پاسخ وارد شوید"}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
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
                try {
                  const created = await api<{ id: string }>(`/api/threads/${thread.id}/replies`, {
                    method: "POST",
                    auth: true,
                    body: JSON.stringify({ content: body }),
                  });
                  if (replyImages.length) {
                    const fd = new FormData();
                    for (const f of replyImages) fd.append("images", f);
                    await api<{ attachments: unknown[] }>(`/api/threads/${thread.id}/replies/${created.id}/images`, {
                      method: "POST",
                      auth: true,
                      body: fd,
                    });
                  }
                  setAnswer("");
                  setReplyImages([]);
                  toast.success("پاسخ ارسال شد — +۲ امتیاز", {
                    icon: <Coins className="h-4 w-4 text-amber-500" />,
                  });
                  await qc.invalidateQueries({ queryKey: ["replies", id] });
                  await qc.invalidateQueries({ queryKey: ["thread", id] });
                } catch (err) {
                  const e = err as ApiError;
                  toast.error(e?.message ?? "امکان ارسال پاسخ نیست. دوباره تلاش کنید.");
                }
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
