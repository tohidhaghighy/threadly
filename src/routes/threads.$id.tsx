import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2, Flag, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextContent } from "@/components/shared/rich-text";
import { ReplyItem } from "@/components/shared/thread/ReplyItem";
import { ReplyComposer } from "@/components/shared/thread/ReplyComposer";
import { stripHtmlToText } from "@/lib/sanitize-html";
import { toast } from "sonner";
import type { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { buildSeo, useSeo } from "@/lib/seo";
import { buildBreadcrumbJsonLd, buildThreadDiscussionJsonLd, buildThreadQaPageJsonLd } from "@/lib/seo-schema";
import { useRecordThreadView, useReplies, useSetBestReply, useThread, useToggleThreadLike } from "@/hooks/api";

export const Route = createFileRoute("/threads/$id")({
  head: ({ params }) => {
    const seo = buildSeo({
      title: "گفتگو",
      description: "مشاهده و ارسال پاسخ برای گفتگوهای انجمن فاطر.",
      path: `/threads/${params.id}`,
      type: "article",
    });
    return { meta: seo.meta, links: seo.links, scripts: seo.scripts };
  },
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">{error.message}</div>,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <h1 className="text-xl font-extrabold">گفتگو پیدا نشد</h1>
      <p className="mt-2 text-muted-foreground">این گفتگو وجود ندارد یا هنوز تأیید نشده است.</p>
      <Link to="/threads" className="mt-4 inline-block text-primary underline">بازگشت به گفتگوها</Link>
    </div>
  ),
  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [shareBusy, setShareBusy] = useState(false);
  const auth = useAuth();

  const threadQuery = useThread(id);
  const repliesQuery = useReplies(id, threadQuery.isSuccess);
  const recordView = useRecordThreadView(id);
  const toggleLike = useToggleThreadLike(id);
  const setBestReply = useSetBestReply(id);

  const thread = threadQuery.data;
  const replies = repliesQuery.data?.items ?? [];
  const canPickBestAnswer = !!auth.user && !!thread && (auth.user.id === thread.author.id || auth.isAdmin);

  const firstImageAttachment = thread?.attachments?.find((a) => a.mimeType.startsWith("image/"))?.url;

  const seoInput = useMemo(() => {
    if (threadQuery.isError) {
      return {
        title: "گفتگو پیدا نشد",
        description: "این گفتگو وجود ندارد یا هنوز تأیید نشده است.",
        path: `/threads/${id}`,
        noindex: true,
      };
    }
    if (!thread) return null;
    const jsonLd = [
      buildThreadQaPageJsonLd(thread, replies),
      buildThreadDiscussionJsonLd(thread),
      buildBreadcrumbJsonLd([
        { name: "خانه", path: "/" },
        { name: "گفتگوها", path: "/threads" },
        {
          name: thread.category,
          path: `/threads?category=${encodeURIComponent(thread.category)}`,
        },
        { name: thread.title, path: `/threads/${thread.id}` },
      ]),
    ];
    return {
      title: thread.title,
      description: thread.excerpt ?? stripHtmlToText(thread.content ?? "").slice(0, 160),
      path: `/threads/${thread.id}`,
      type: "article" as const,
      image: firstImageAttachment,
      imageAlt: thread.title,
      publishedTime: thread.createdAt,
      modifiedTime: thread.updatedAt,
      author: thread.author.displayName,
      section: thread.category,
      tags: thread.tags ?? [],
      keywords: [thread.category, ...(thread.tags ?? [])].filter(Boolean),
      jsonLd,
    };
  }, [thread, replies, firstImageAttachment, threadQuery.isError, id]);

  useSeo(seoInput);

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
    recordView.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
          {headerModel?.content ? (
            <RichTextContent html={headerModel.content} className="text-base text-foreground/90" />
          ) : null}

          {headerModel?.attachments && headerModel.attachments.length > 0 ? (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
              <p className="mb-3 text-xs font-semibold text-muted-foreground">تصاویر پیوست</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {headerModel.attachments.map((a, idx) => (
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
                      alt={`پیوست ${idx + 1} — ${headerModel.title}`}
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
            disabled={!auth.token || toggleLike.isPending || !thread}
            onClick={async () => {
              if (!auth.token) {
                toast.error("برای لایک باید وارد شوید.");
                return;
              }
              if (!thread) return;
              try {
                await toggleLike.mutateAsync();
              } catch {
                toast.error("عملیات انجام نشد. دوباره تلاش کنید.");
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
            <ReplyItem
              key={r.id}
              reply={r}
              threadId={id}
              canPickBestAnswer={canPickBestAnswer}
              bestBusy={setBestReply.isPending}
              onToggleBest={async (replyId) => {
                try {
                  const res = await setBestReply.mutateAsync(replyId);
                  if (res.bestReplyId) toast.success("پاسخ برتر انتخاب شد.");
                  else toast.success("پاسخ برتر حذف شد.");
                } catch (err) {
                  const e = err as ApiError;
                  toast.error(e?.message ?? "امکان انتخاب پاسخ برتر نیست.");
                }
              }}
            />
          ))}
        </div>

        <ReplyComposer
          threadId={id}
          canPost={!!auth.token && !!thread}
          disabled={repliesQuery.isFetching}
        />
      </section>
    </div>
  );
}
