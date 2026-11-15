import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Inbox } from "lucide-react";
import { AuthGate } from "@/features/auth/components/AuthGate";
import { useAuth } from "@/features/auth/auth-context";
import { ThreadCard } from "@/features/threads/components/ThreadCard";
import { ThreadCardSkeleton } from "@/features/threads/components/ThreadCardSkeleton";
import { useFollowingThreads } from "@/features/users/hooks";
import { buildSeo, useSeo } from "@/features/seo/seo";

export const Route = createFileRoute("/following")({
  head: () => {
    const seo = buildSeo({
      title: "گفتگوهای دنبال‌شده",
      description: "موضوع‌های کاربرانی که دنبال می‌کنید.",
      path: "/following",
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: FollowingPage,
});

function FollowingPage() {
  const auth = useAuth();
  useSeo({
    title: "گفتگوهای دنبال‌شده",
    description: "موضوع‌های کاربرانی که دنبال می‌کنید.",
    path: "/following",
    noindex: true,
  });
  const q = useFollowingThreads(auth.ready && !!auth.token);
  const items = q.data?.items ?? [];

  return (
    <AuthGate isAuthenticated={!!auth.token} ready={auth.ready} message="برای دیدن گفتگوهای دنبال‌شده وارد شوید.">
      <div className="mx-auto w-full max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">گفتگوهای دنبال‌شده</h1>
        <p className="mt-1 text-sm text-muted-foreground">موضوع‌های تازه‌ای که افرادی که دنبال می‌کنید منتشر کرده‌اند.</p>

        <div className="mt-6 space-y-4">
          {q.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <ThreadCardSkeleton
                key={i}
                className="rounded-xl border border-border/60 bg-card p-5"
              />
            ))
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-lg font-bold">هنوز گفتگویی نیست</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                از نوار کاربران آنلاین روی یک نفر بزنید و او را دنبال کنید تا موضوع‌هایش اینجا بیاید.
              </p>
              <Link to="/users" className="mt-4 text-sm font-semibold text-primary hover:underline">
                دیدن کاربران
              </Link>
            </div>
          ) : (
            items.map((t) => (
              <Link key={t.id} to="/threads/$id" params={{ id: t.id }} className="block">
                <ThreadCard
                  thread={{
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
                  }}
                />
              </Link>
            ))
          )}
        </div>
      </div>
    </AuthGate>
  );
}
