import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Download,
  Globe,
  Grid2X2,
  HelpCircle,
  Home,
  MessageSquare,
  MessageSquareText,
  PlusCircle,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCategories } from "@/lib/categories";
import { categories as mockCategories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type NavKey = "home" | "threads" | "new" | "users" | "more";

function pathMatches(pathname: string, target: string) {
  if (target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function MobileBottomNav() {
  const { t } = useI18n();
  const auth = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);

  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data?.items ?? [];
  const iconByTitle = new Map(mockCategories.map((c) => [c.title, c.icon]));

  const active: NavKey =
    pathMatches(pathname, "/new")
      ? "new"
      : pathMatches(pathname, "/threads")
        ? "threads"
        : pathMatches(pathname, "/users")
          ? "users"
          : pathname === "/install" || pathname.startsWith("/admin") || pathname.startsWith("/settings")
            ? "more"
            : pathMatches(pathname, "/")
              ? "home"
              : "home";

  const items: Array<{
    key: NavKey;
    label: string;
    icon: typeof Home;
    to?: string;
    onClick?: () => void;
    emphasize?: boolean;
  }> = [
    { key: "home", label: t("nav.home"), icon: Home, to: "/" },
    { key: "threads", label: t("nav.threads"), icon: MessageSquare, to: "/threads" },
    { key: "new", label: t("nav.newThread"), icon: PlusCircle, to: "/new", emphasize: true },
    { key: "users", label: t("nav.users"), icon: Users, to: "/users" },
    { key: "more", label: t("nav.more"), icon: Grid2X2, onClick: () => setMoreOpen(true) },
  ];

  const adminLinks = [
    { title: t("nav.admin"), url: "/admin", icon: ShieldCheck },
    { title: "دسته‌بندی‌ها", url: "/admin/categories", icon: Tags },
    { title: "SEO صفحات", url: "/admin/seo", icon: Globe },
    { title: "کامنت‌ها", url: "/admin/comments", icon: MessageSquareText },
    { title: t("nav.settings"), url: "/settings", icon: Settings },
  ];

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 pb-safe shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl md:hidden"
        aria-label={t("nav.navigation")}
      >
        <ul className="mx-auto grid h-16 max-w-lg grid-cols-5 items-end px-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            const className = cn(
              "flex h-full min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
              item.emphasize && "relative -top-2",
            );

            const content = (
              <>
                <span
                  className={cn(
                    "flex items-center justify-center rounded-xl transition-all",
                    item.emphasize
                      ? "h-12 w-12 bg-gradient-primary text-primary-foreground shadow-glow"
                      : cn("h-8 w-8", isActive && "bg-primary/15"),
                  )}
                >
                  <Icon className={cn(item.emphasize ? "h-5 w-5" : "h-5 w-5")} />
                </span>
                <span className="line-clamp-1 max-w-full truncate">{item.label}</span>
              </>
            );

            return (
              <li key={item.key} className="min-w-0">
                {item.to ? (
                  <Link
                    to={item.to}
                    className={className}
                    onClick={() => setMoreOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {content}
                  </Link>
                ) : (
                  <button type="button" className={cn(className, "w-full")} onClick={item.onClick}>
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-border/60 p-0 pb-safe md:hidden"
        >
          <SheetHeader className="border-b border-border/60 px-4 py-4 text-start">
            <SheetTitle>{t("nav.moreTitle")}</SheetTitle>
            <SheetDescription>{t("nav.moreDesc")}</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 py-4">
            <section>
              <h3 className="mb-3 text-sm font-bold text-foreground">{t("nav.quickLinks")}</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/install"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card transition hover:border-primary/40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Download className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 text-sm font-semibold leading-snug">{t("nav.install")}</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card transition hover:border-primary/40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Settings className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 text-sm font-semibold leading-snug">{t("nav.settings")}</span>
                </Link>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold text-foreground">{t("nav.categories")}</h3>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => {
                  const Icon = iconByTitle.get(cat.title) ?? HelpCircle;
                  return (
                    <Link
                      key={cat.id}
                      to="/threads"
                      search={{ category: cat.title }}
                      onClick={() => setMoreOpen(false)}
                      className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-3 shadow-card transition hover:border-primary/40"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="line-clamp-2 text-sm font-semibold leading-snug">{cat.title}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {cat.threadsCount.toLocaleString("fa-IR")} {t("nav.threads")}
                      </span>
                    </Link>
                  );
                })}
                {!categories.length ? (
                  <p className="col-span-2 text-sm text-muted-foreground">{t("nav.categoriesEmpty")}</p>
                ) : null}
              </div>
            </section>

            {auth.isAdmin ? (
              <section>
                <h3 className="mb-3 text-sm font-bold text-foreground">{t("nav.admin")}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {adminLinks.map((item) => (
                    <Link
                      key={item.url}
                      to={item.url}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card transition hover:border-primary/40"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 text-sm font-semibold leading-snug">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
