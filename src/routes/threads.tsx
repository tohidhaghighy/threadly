import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Filter, Inbox } from "lucide-react";
import { ThreadCard } from "@/components/ThreadCard";
import { threads, categories } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/threads")({
  head: () => ({
    meta: [
      { title: "گفتگوها — پارس‌بیلد" },
      { name: "description", content: "آخرین موضوعات انجمن پارس‌بیلد." },
    ],
  }),
  component: ThreadsPage,
});

const filters = ["جدیدترین", "محبوب‌ترین", "بدون پاسخ", "حل‌شده"];

function ThreadsPage() {
  const [activeFilter, setActiveFilter] = useState("جدیدترین");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [loading] = useState(false);

  const visible = activeCat ? threads.filter((t) => t.category === activeCat) : threads;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">همه گفتگوها</h1>
        <p className="text-sm text-muted-foreground">
          {threads.length} موضوع فعال در {categories.length} دسته
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
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
          <Button variant="ghost" size="sm"><Filter className="h-4 w-4" /> پیشرفته</Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-5">
              <div className="flex gap-4">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-bold">هنوز موضوعی نیست</h3>
            <p className="mt-1 text-sm text-muted-foreground">اولین نفری باشید که گفتگو را شروع می‌کند.</p>
            <Button variant="hero" className="mt-4">ایجاد موضوع</Button>
          </div>
        ) : (
          visible.map((t) => <ThreadCard key={t.id} thread={t} />)
        )}
      </div>
    </div>
  );
}
