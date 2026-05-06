import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2, Bookmark, Flag, ArrowRight, Image as ImageIcon, Code2, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { threads, replies } from "@/lib/mock-data";

export const Route = createFileRoute("/threads/$id")({
  loader: ({ params }) => {
    const thread = threads.find((t) => t.id === params.id);
    if (!thread) throw notFound();
    return { thread };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.thread.title ?? "گفتگو"} — پارس‌بیلد` },
      { name: "description", content: loaderData?.thread.excerpt ?? "" },
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
  const { thread } = Route.useLoaderData();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <Link to="/threads" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4" /> بازگشت به گفتگوها
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
        <div className="border-b border-border/60 bg-gradient-to-l from-primary/10 to-transparent p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">{thread.category}</Badge>
            {thread.tags.map((t) => (
              <span key={t} className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold leading-relaxed md:text-3xl">{thread.title}</h1>

          <div className="mt-4 flex items-center gap-3">
            <Avatar className="h-11 w-11 ring-2 ring-primary/40">
              <AvatarFallback className="bg-gradient-primary font-bold text-primary-foreground">
                {thread.author.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{thread.author.name}</p>
              <p className="text-xs text-muted-foreground">{thread.time} • {thread.views.toLocaleString("fa-IR")} بازدید</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6 text-base leading-relaxed text-foreground/90">
          <p>{thread.excerpt}</p>
          <p>
            مشخصات کامل سیستم: Ryzen 7 7800X3D، رم ۳۲ گیگ DDR5 6000، پاور ۸۵۰ وات Gold، کیس Lian Li O11 Dynamic.
            ویندوز ۱۱ کاملاً آپدیت شده و درایور NVIDIA نسخه آخر نصب است.
          </p>
          <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">تنظیمات فعلی:</p>
            <pre className="overflow-x-auto font-mono text-xs leading-6 text-foreground" dir="ltr">
{`Resolution:    2560x1440
Preset:        Ultra
Ray Tracing:   Psycho
DLSS:          Off
Frame Gen:     Off`}
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-6 py-4">
          <Button variant="glow" size="sm"><Heart className="h-4 w-4" /> {thread.likes}</Button>
          <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4" /> {thread.replies} پاسخ</Button>
          <Button variant="ghost" size="sm"><Bookmark className="h-4 w-4" /> ذخیره</Button>
          <Button variant="ghost" size="sm"><Share2 className="h-4 w-4" /> اشتراک</Button>
          <Button variant="ghost" size="sm" className="ms-auto text-muted-foreground"><Flag className="h-4 w-4" /> گزارش</Button>
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold">{thread.replies} پاسخ</h2>
        <div className="mt-4 space-y-4">
          {replies.map((r) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-card p-5 shadow-card">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-border">
                  <AvatarFallback className="bg-secondary text-sm font-bold">{r.author.avatar}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{r.author.name}</span>
                    {r.author.role && (
                      <Badge variant="secondary" className="bg-primary/15 text-primary text-[10px]">
                        {r.author.role}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">• {r.time}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">{r.content}</p>
                  {r.code && (
                    <pre className="mt-3 overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs leading-6" dir="ltr">
                      {r.code}
                    </pre>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                      <Heart className="h-3.5 w-3.5" /> {r.likes}
                    </button>
                    <button className="text-muted-foreground hover:text-primary">پاسخ</button>
                    <Separator orientation="vertical" className="h-3" />
                    <button className="text-muted-foreground hover:text-primary">اشتراک</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border/60 bg-card p-4 shadow-card">
          <p className="mb-3 text-sm font-semibold">پاسخ شما</p>
          <Textarea placeholder="نظر یا تجربه خود را بنویسید..." className="min-h-32 resize-none bg-muted/30" />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1">
              <Button variant="ghost" size="icon"><ImageIcon className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon"><Code2 className="h-4 w-4" /></Button>
            </div>
            <Button variant="hero" size="sm"><Send className="h-4 w-4" /> ارسال پاسخ</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
