import { useEffect, useId, useState, type ReactNode } from "react";
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
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCategories } from "@/lib/categories";
import { categories as mockCategories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type DockKey = "home" | "threads" | "new" | "users" | "menu";

function pathMatches(pathname: string, target: string) {
  if (target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function BottomMegaMenu() {
  const { t } = useI18n();
  const auth = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const titleId = useId();

  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data?.items ?? [];
  const iconByTitle = new Map(mockCategories.map((c) => [c.title, c.icon]));
  const colorByTitle = new Map(mockCategories.map((c) => [c.title, c.color]));

  const active: DockKey =
    pathMatches(pathname, "/new")
      ? "new"
      : pathMatches(pathname, "/threads")
        ? "threads"
        : pathMatches(pathname, "/users")
          ? "users"
          : pathname === "/install" ||
              pathname.startsWith("/admin") ||
              pathname.startsWith("/settings")
            ? "menu"
            : "home";

  const openMenu = () => {
    setLeaving(false);
    setOpen(true);
    requestAnimationFrame(() => setVisible(true));
  };

  const closeMenu = () => {
    setVisible(false);
    setLeaving(true);
  };

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => {
      setOpen(false);
      setLeaving(false);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close mega panel on route change
  useEffect(() => {
    if (open) closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const dockItems: Array<{
    key: DockKey;
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
    {
      key: "menu",
      label: t("nav.megaMenu"),
      icon: open ? X : Grid2X2,
      onClick: () => (open ? closeMenu() : openMenu()),
    },
  ];

  const quickLinks = [
    { title: t("nav.install"), url: "/install", icon: Download, hint: t("nav.megaInstallHint") },
    { title: t("nav.settings"), url: "/settings", icon: Settings, hint: t("nav.megaSettingsHint") },
    { title: t("nav.newThread"), url: "/new", icon: PlusCircle, hint: t("nav.megaNewHint") },
  ];

  const adminLinks = [
    { title: t("nav.admin"), url: "/admin", icon: ShieldCheck },
    { title: "دسته‌بندی‌ها", url: "/admin/categories", icon: Tags },
    { title: "SEO صفحات", url: "/admin/seo", icon: Globe },
    { title: "کامنت‌ها", url: "/admin/comments", icon: MessageSquareText },
  ];

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button
            type="button"
            aria-label={t("nav.megaClose")}
            className={cn(
              "absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-200",
              visible && !leaving ? "opacity-100" : "opacity-0",
            )}
            onClick={closeMenu}
          />

          <div
            className={cn(
              "absolute inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-10 mx-auto w-full max-w-5xl px-3 sm:px-4",
              "transition-all duration-200 ease-out",
              visible && !leaving ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            )}
          >
            <div className="mega-panel overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-glow backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <h2 id={titleId} className="text-base font-extrabold sm:text-lg">
                    {t("nav.megaTitle")}
                  </h2>
                  <p className="text-xs text-muted-foreground sm:text-sm">{t("nav.megaDesc")}</p>
                </div>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={t("nav.megaClose")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[min(62vh,34rem)] space-y-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
                <MegaSection title={t("nav.quickLinks")} delay={0} leaving={leaving}>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {quickLinks.map((item, i) => (
                      <MegaCard
                        key={item.url}
                        to={item.url}
                        title={item.title}
                        hint={item.hint}
                        icon={<item.icon className="h-5 w-5" />}
                        delayMs={40 + i * 45}
                        leaving={leaving}
                        onNavigate={closeMenu}
                      />
                    ))}
                  </div>
                </MegaSection>

                <MegaSection title={t("nav.categories")} delay={80} leaving={leaving}>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {categories.map((cat, i) => {
                      const Icon = iconByTitle.get(cat.title) ?? HelpCircle;
                      const color = colorByTitle.get(cat.title) ?? "from-orange-500/20 to-amber-500/10";
                      return (
                        <MegaCard
                          key={cat.id}
                          to="/threads"
                          search={{ category: cat.title }}
                          title={cat.title}
                          hint={`${cat.threadsCount.toLocaleString("fa-IR")} ${t("nav.threads")}`}
                          icon={<Icon className="h-5 w-5" />}
                          gradient={color}
                          delayMs={90 + i * 40}
                          leaving={leaving}
                          onNavigate={closeMenu}
                        />
                      );
                    })}
                    {!categories.length ? (
                      <p className="col-span-full text-sm text-muted-foreground">{t("nav.categoriesEmpty")}</p>
                    ) : null}
                  </div>
                </MegaSection>

                {auth.isAdmin ? (
                  <MegaSection title={t("nav.admin")} delay={140} leaving={leaving}>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {adminLinks.map((item, i) => (
                        <MegaCard
                          key={item.url}
                          to={item.url}
                          title={item.title}
                          icon={<item.icon className="h-5 w-5" />}
                          delayMs={120 + i * 40}
                          leaving={leaving}
                          onNavigate={closeMenu}
                        />
                      ))}
                    </div>
                  </MegaSection>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-[60] border-t border-border/60 bg-background/95 pb-safe shadow-[0_-10px_40px_-18px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        aria-label={t("nav.navigation")}
      >
        <ul className="mx-auto grid h-[4.25rem] max-w-3xl grid-cols-5 items-end px-2 sm:px-4">
          {dockItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key || (item.key === "menu" && open);
            const className = cn(
              "flex h-full min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold transition-colors sm:text-[11px]",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              item.emphasize && "relative -top-2.5",
            );

            const content = (
              <>
                <span
                  className={cn(
                    "flex items-center justify-center rounded-2xl transition-all duration-200",
                    item.emphasize
                      ? "h-12 w-12 bg-gradient-primary text-primary-foreground shadow-glow sm:h-13 sm:w-13"
                      : cn("h-9 w-9", isActive && "bg-primary/15"),
                    item.key === "menu" && open && "bg-primary/15 rotate-90",
                  )}
                >
                  <Icon className="h-5 w-5" />
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
                    onClick={() => {
                      if (open) closeMenu();
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={cn(className, "w-full")}
                    onClick={item.onClick}
                    aria-expanded={item.key === "menu" ? open : undefined}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function MegaSection({
  title,
  children,
  delay,
  leaving,
}: {
  title: string;
  children: ReactNode;
  delay: number;
  leaving: boolean;
}) {
  return (
    <section
      className={cn("mega-section", leaving ? "mega-section-out" : "mega-section-in")}
      style={{ animationDelay: leaving ? "0ms" : `${delay}ms` }}
    >
      <h3 className="mb-2.5 text-sm font-bold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function MegaCard({
  to,
  search,
  title,
  hint,
  icon,
  gradient,
  delayMs,
  leaving,
  onNavigate,
}: {
  to: string;
  search?: Record<string, string>;
  title: string;
  hint?: string;
  icon: ReactNode;
  gradient?: string;
  delayMs: number;
  leaving: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={to}
      // @ts-expect-error search is route-specific; category filter is valid for /threads
      search={search}
      onClick={onNavigate}
      className={cn(
        "mega-card group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-3 shadow-card transition",
        "hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-glow",
        leaving ? "mega-card-out" : "mega-card-in",
      )}
      style={{ animationDelay: leaving ? "0ms" : `${delayMs}ms` }}
    >
      {gradient ? (
        <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition group-hover:opacity-100", gradient)} />
      ) : null}
      <div className="relative flex flex-col gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          {icon}
        </span>
        <span className="line-clamp-2 text-sm font-semibold leading-snug">{title}</span>
        {hint ? <span className="line-clamp-1 text-[11px] text-muted-foreground">{hint}</span> : null}
      </div>
    </Link>
  );
}
