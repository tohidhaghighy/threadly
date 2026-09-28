import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AtSign, Bell, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyAlerts } from "@/api/users";
import type { UserAlertItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { buildSeo } from "@/lib/seo";
import { AuthGate } from "@/components/shared/layout/AuthGate";
import { AdminPager, useClientPage } from "@/components/admin/AdminPager";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { pageContainerClasses } from "@/styles/shared/page";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => {
    const seo = buildSeo({
      title: "اعلان‌ها",
      description: "همه اعلان‌های پاسخ، منشن و فعالیت موضوعات شما در انجمن فاطر.",
      path: "/alerts",
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: AlertsPage,
});

function alertMeta(alert: UserAlertItem) {
  if (alert.type === "mention") {
    return { label: "منشن", icon: AtSign, className: "bg-violet-500/15 text-violet-600 dark:text-violet-300" };
  }
  if (alert.type === "reply") {
    return { label: "پاسخ", icon: MessageCircle, className: "bg-sky-500/15 text-sky-600 dark:text-sky-300" };
  }
  return { label: "فعالیت", icon: Activity, className: "bg-amber-500/15 text-amber-600 dark:text-amber-300" };
}

function AlertsPage() {
  const auth = useAuth();
  const alertsQuery = useQuery({
    queryKey: ["myAlerts", "all", auth.user?.id],
    queryFn: () => fetchMyAlerts(200),
    enabled: auth.ready && !!auth.token,
  });
  const items = alertsQuery.data?.items ?? [];
  const page = useClientPage(items, auth.user?.id ?? "");

  return (
    <AuthGate
      ready={auth.ready}
      isAuthenticated={!!auth.token}
      message="برای دیدن اعلان‌ها وارد شوید."
    >
      <div dir="rtl" className={pageContainerClasses}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Bell className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold">اعلان‌ها</h1>
            <p className="text-sm text-muted-foreground">پاسخ‌ها، منشن‌ها و فعالیت موضوعات شما</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
          {alertsQuery.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : alertsQuery.isError ? (
            <p className="p-6 text-center text-sm text-destructive">بارگذاری اعلان‌ها ناموفق بود.</p>
          ) : items.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">اعلان جدیدی ندارید.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {page.items.map((alert) => {
                const meta = alertMeta(alert);
                const Icon = meta.icon;
                return (
                  <li key={alert.id}>
                    <Link
                      to="/threads/$id"
                      params={{ id: alert.thread.id }}
                      hash="replies"
                      className="flex items-start gap-3 px-4 py-4 transition hover:bg-muted/40"
                    >
                      <span className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.className)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {meta.label}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString("fa-IR")}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm font-semibold leading-snug">{alert.message}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{alert.thread.title}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <AdminPager
            page={page.page}
            pageCount={page.pageCount}
            total={page.total}
            onPageChange={page.setPage}
          />
        </div>
      </div>
    </AuthGate>
  );
}
