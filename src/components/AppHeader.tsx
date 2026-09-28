import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, PlusCircle, User, LogOut, Settings, Bell, Download, Cpu, Home, MessageSquare, Users, Grid2X2, ShieldCheck, HelpCircle, X, ChevronDown, Tags, Globe, MessageSquareText } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCategories } from "@/lib/categories";
import { categories as mockCategories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api, type UserAlertItem } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { applyTheme, readStoredTheme, storeTheme, type ThemeMode } from "@/lib/theme";

const menuContentClass =
  "w-[min(20rem,calc(100vw-1rem))] max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain p-1.5 sm:w-56";

const profileItemClass =
  "flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-center text-sm sm:min-h-9 sm:py-2";

const adminNavLinks = [
  { to: "/admin" as const, labelKey: "nav.adminPanel" as const, icon: ShieldCheck },
  { to: "/admin/categories" as const, labelKey: "nav.adminCategories" as const, icon: Tags },
  { to: "/admin/seo" as const, labelKey: "nav.adminSeo" as const, icon: Globe },
  { to: "/admin/comments" as const, labelKey: "nav.adminComments" as const, icon: MessageSquareText },
];

export function AppHeader() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    typeof window === "undefined" ? "light" : readStoredTheme(),
  );
  const { t } = useI18n();
  const auth = useAuth();
  const dark = theme === "dark";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [desktopMega, setDesktopMega] = useState(false);
  const megaRef = useRef<HTMLDivElement | null>(null);
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data?.items ?? [];
  const iconByTitle = useMemo(
    () => new Map<string, ComponentType<{ className?: string }>>(mockCategories.map((c) => [c.title, c.icon])),
    [],
  );
  const colorByTitle = useMemo(
    () => new Map(mockCategories.map((c) => [c.title, c.color])),
    [],
  );
  const seenStorageKey = auth.user ? `threadly_alerts_seen_at_${auth.user.id}` : "threadly_alerts_seen_at_guest";
  const [alertsSeenAt, setAlertsSeenAt] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(seenStorageKey);
      return raw ? Number(raw) || 0 : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(seenStorageKey);
      setAlertsSeenAt(raw ? Number(raw) || 0 : 0);
    } catch {
      setAlertsSeenAt(0);
    }
  }, [seenStorageKey]);

  const alertsQuery = useQuery({
    queryKey: ["myAlerts", auth.user?.id],
    queryFn: () => api<{ items: UserAlertItem[]; nextCursor: string | null }>("/api/users/me/alerts?limit=20", { auth: true }),
    enabled: !!auth.token,
    refetchInterval: 60_000,
  });

  const alerts = alertsQuery.data?.items ?? [];
  const unreadCount = useMemo(
    () => alerts.filter((a) => new Date(a.createdAt).getTime() > alertsSeenAt).length,
    [alerts, alertsSeenAt],
  );

  const markAlertsAsSeen = () => {
    const now = Date.now();
    setAlertsSeenAt(now);
    try {
      localStorage.setItem(seenStorageKey, String(now));
    } catch {
      // ignore local storage errors
    }
  };

  useEffect(() => {
    applyTheme(theme);
    storeTheme(theme);
  }, [theme]);

  useEffect(() => {
    setDesktopMega(false);
  }, [pathname]);

  useEffect(() => {
    if (!desktopMega) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDesktopMega(false);
    };
    // Use click (not mousedown) so Links inside the panel receive the full click.
    const onPointer = (e: MouseEvent) => {
      if (!megaRef.current?.contains(e.target as Node)) setDesktopMega(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onPointer);
    };
  }, [desktopMega]);

  return (
    <header className="relative flex h-14 items-center gap-1.5 border-t border-border/40 px-2 sm:h-16 sm:gap-3 sm:px-3 md:px-6">
      <Link to="/" className="group flex min-w-0 flex-1 items-center gap-2 md:flex-none">
        <div className="animate-glow-pulse flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 sm:h-9 sm:w-9">
          <Cpu className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
        </div>
        <span className="animate-gradient-text truncate bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-sm font-extrabold text-transparent sm:text-base">
          {t("site.headerbrand")}
        </span>
      </Link>

      <nav className="ms-2 hidden items-center gap-1 md:flex lg:ms-4">
        {[
          { to: "/", label: t("nav.home"), icon: Home },
          { to: "/threads", label: t("nav.threads"), icon: MessageSquare },
          { to: "/users", label: t("nav.users"), icon: Users },
        ].map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              preload={false}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        {auth.isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                {t("nav.admin")}
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={8} className={menuContentClass}>
              <DropdownMenuLabel className="px-3 py-2 text-start">{t("nav.admin")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {adminNavLinks.map((item) => {
                const Icon = item.icon;
                const active =
                  item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to);
                return (
                  <DropdownMenuItem asChild key={item.to} className={profileItemClass}>
                    <Link
                      to={item.to}
                      preload={false}
                      className={cn(active && "bg-primary/10 text-primary")}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {t(item.labelKey)}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </nav>

      <div ref={megaRef} className="hidden md:block">
        <button
          type="button"
          onClick={() => setDesktopMega((open) => !open)}
          aria-expanded={desktopMega}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
            desktopMega
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {desktopMega ? <X className="h-4 w-4" /> : <Grid2X2 className="h-4 w-4" />}
          {t("nav.categories")}
        </button>

        {desktopMega ? (
          <div className="mega-section-in absolute inset-x-4 top-[calc(100%+0.5rem)] z-50">
            <div className="mega-panel glass-strong border-gradient max-h-[min(72vh,40rem)] overflow-y-auto overscroll-contain rounded-3xl border border-border/60 p-5 shadow-glow">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0 text-start">
                  <h2 className="text-lg font-extrabold">{t("nav.categories")}</h2>
                  <p className="text-sm text-muted-foreground">یک دسته‌بندی را برای مرور گفتگوها انتخاب کنید</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDesktopMega(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={t("nav.megaClose")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                  {categories.map((cat) => {
                    const Icon = iconByTitle.get(cat.title) ?? HelpCircle;
                    const color = colorByTitle.get(cat.title) ?? "from-orange-500/20 to-amber-500/10";
                    return (
                      <Link
                        key={cat.id}
                        to="/threads"
                        search={{ q: "", category: cat.title }}
                        preload={false}
                        onClick={() => setDesktopMega(false)}
                        className="glass group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-border/60 p-3 text-center shadow-card transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-glow"
                      >
                        <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition group-hover:opacity-100", color)} />
                        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="relative text-sm font-semibold">{cat.title}</span>
                        <span className="relative text-[11px] text-muted-foreground">
                          {cat.threadsCount.toLocaleString("fa-IR")} {t("nav.threads")}
                        </span>
                      </Link>
                    );
                  })}
                  {!categories.length ? (
                    <p className="col-span-full text-center text-sm text-muted-foreground">{t("nav.categoriesEmpty")}</p>
                  ) : null}
                </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="ms-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 sm:h-9 sm:w-9"
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          aria-label={t("header.toggleTheme")}
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button asChild variant="hero" size="sm" className="hidden md:inline-flex">
          <Link to="/new">
            <PlusCircle className="h-4 w-4" />
            {t("nav.newThread")}
          </Link>
        </Button>

        <Link
          to="/alerts"
          onClick={() => {
            if (auth.token) markAlertsAsSeen();
          }}
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-muted sm:h-9 sm:w-9",
            pathname === "/alerts" && "bg-primary/10 text-primary",
          )}
          aria-label="اعلان‌ها"
          aria-current={pathname === "/alerts" ? "page" : undefined}
        >
          <Bell className="h-5 w-5" />
          {auth.token && unreadCount > 0 ? (
            <span className="absolute -end-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-extrabold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ms-0.5 flex items-center gap-2 rounded-full border border-border/60 p-1 transition hover:bg-muted sm:ms-1 sm:ps-3">
              <span className="hidden max-w-[8rem] truncate text-sm font-medium md:inline">
                {auth.user?.name ?? t("header.guestUser")}
              </span>
              <Avatar className="h-8 w-8 ring-2 ring-primary/40">
                {auth.user?.avatarUrl ? <AvatarImage src={auth.user.avatarUrl} alt={auth.user.name} /> : null}
                <AvatarFallback className="bg-gradient-primary text-xs font-bold text-primary-foreground">
                  {(auth.user?.name?.slice(0, 2) ?? "GU").toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className={`${menuContentClass} text-center`}>
            <DropdownMenuLabel className="flex flex-col items-center justify-center gap-2 px-3 py-3 text-center">
              <Avatar className="h-11 w-11 shrink-0 sm:h-10 sm:w-10">
                {auth.user?.avatarUrl ? <AvatarImage src={auth.user.avatarUrl} alt={auth.user.name} /> : null}
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {(auth.user?.name?.slice(0, 2) ?? "GU").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col items-center">
                <span className="w-full truncate text-center text-sm font-semibold">{auth.user?.name ?? t("header.guestUser")}</span>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {auth.user?.role ?? t("header.member")}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className={profileItemClass}>
              <Link to={auth.user ? "/users/$id" : "/login"} params={auth.user ? { id: auth.user.id } : undefined}>
                <User className="h-4 w-4 shrink-0" />
                {t("header.profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className={profileItemClass}>
              <Link to="/change-password">
                <Settings className="h-4 w-4 shrink-0" />
                تغییر رمز عبور
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className={profileItemClass}>
              <Link to={auth.user ? "/settings" : "/login"}>
                <Settings className="h-4 w-4 shrink-0" />
                تنظیمات پروفایل
              </Link>
            </DropdownMenuItem>
            {auth.isAdmin ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="px-3 py-2 text-center text-xs text-muted-foreground">
                  {t("nav.admin")}
                </DropdownMenuLabel>
                {adminNavLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem asChild key={item.to} className={profileItemClass}>
                      <Link to={item.to} preload={false}>
                        <Icon className="h-4 w-4 shrink-0" />
                        {t(item.labelKey)}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </>
            ) : null}
            <DropdownMenuItem asChild className={profileItemClass}>
              <Link to="/install">
                <Download className="h-4 w-4 shrink-0" />
                {t("nav.install")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {auth.token ? (
              <DropdownMenuItem
                className={`${profileItemClass} text-destructive focus:text-destructive`}
                onClick={() => {
                  auth.logout();
                }}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {t("header.signOut")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild className={profileItemClass}>
                <Link to="/login">
                  <LogOut className="h-4 w-4 shrink-0" />
                  {t("header.signIn")}
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
