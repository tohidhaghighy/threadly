import { Link } from "@tanstack/react-router";
import { Moon, Sun, PlusCircle, User, LogOut, Settings, Bell, AtSign, MessageCircle, Activity, Download, Cpu } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
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

const menuItemClass = "min-h-11 cursor-pointer rounded-lg px-3 py-2.5 text-sm sm:min-h-9 sm:py-2";

export function AppHeader() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    typeof window === "undefined" ? "light" : readStoredTheme(),
  );
  const { t } = useI18n();
  const auth = useAuth();
  const dark = theme === "dark";
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

  const alertIcon = (alert: UserAlertItem) => {
    if (alert.type === "mention") return <AtSign className="h-4 w-4 text-violet-500" />;
    if (alert.type === "reply") return <MessageCircle className="h-4 w-4 text-sky-500" />;
    return <Activity className="h-4 w-4 text-amber-500" />;
  };

  useEffect(() => {
    applyTheme(theme);
    storeTheme(theme);
  }, [theme]);

  return (
    <header className="flex h-14 items-center gap-1.5 border-t border-border/50 bg-background/80 px-2 backdrop-blur-xl sm:h-16 sm:gap-3 sm:px-3 md:px-6">
      <Link to="/" className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-glow sm:h-9 sm:w-9">
          <Cpu className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
        </div>
        <span className="truncate text-sm font-extrabold text-gradient-primary sm:text-base">
          {t("site.headerbrand")}
        </span>
      </Link>

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

        <DropdownMenu
          onOpenChange={(open) => {
            if (open) markAlertsAsSeen();
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-muted sm:h-9 sm:w-9"
              aria-label="اعلان‌ها"
            >
              <Bell className="h-5 w-5" />
              {auth.token && unreadCount > 0 ? (
                <span className="absolute -end-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-extrabold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className={menuContentClass}>
            <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
              <span>اعلان‌ها</span>
              {auth.token ? (
                <Badge variant="outline" className="text-[10px]">
                  {alerts.length.toLocaleString("fa-IR")} مورد
                </Badge>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!auth.token ? (
              <DropdownMenuItem asChild className={menuItemClass}>
                <Link to="/login">برای دیدن اعلان‌ها وارد شوید</Link>
              </DropdownMenuItem>
            ) : alertsQuery.isLoading ? (
              <div className="px-3 py-3 text-sm text-muted-foreground">در حال بارگذاری اعلان‌ها...</div>
            ) : alerts.length === 0 ? (
              <div className="px-3 py-3 text-sm text-muted-foreground">اعلان جدیدی ندارید.</div>
            ) : (
              alerts.map((alert) => (
                <DropdownMenuItem asChild key={alert.id} className={`${menuItemClass} items-start gap-3`}>
                  <Link to="/threads/$id" params={{ id: alert.thread.id }} hash="replies">
                    <span className="mt-0.5 shrink-0 rounded-md bg-muted p-1.5">{alertIcon(alert)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm font-semibold leading-snug">{alert.message}</span>
                      <span className="mt-0.5 block line-clamp-1 text-xs text-muted-foreground">{alert.thread.title}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString("fa-IR")}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
          <DropdownMenuContent align="end" sideOffset={8} className={menuContentClass}>
            <DropdownMenuLabel className="flex items-center gap-3 px-3 py-3">
              <Avatar className="h-11 w-11 shrink-0 sm:h-10 sm:w-10">
                {auth.user?.avatarUrl ? <AvatarImage src={auth.user.avatarUrl} alt={auth.user.name} /> : null}
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {(auth.user?.name?.slice(0, 2) ?? "GU").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">{auth.user?.name ?? t("header.guestUser")}</span>
                <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
                  {auth.user?.role ?? t("header.member")}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className={menuItemClass}>
              <Link to={auth.user ? "/users/$id" : "/login"} params={auth.user ? { id: auth.user.id } : undefined}>
                <User className="me-2 h-4 w-4 shrink-0" />
                {t("header.profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className={menuItemClass}>
              <Link to="/change-password">
                <Settings className="me-2 h-4 w-4 shrink-0" />
                تغییر رمز عبور
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className={menuItemClass}>
              <Link to={auth.user ? "/settings" : "/login"}>
                <Settings className="me-2 h-4 w-4 shrink-0" />
                تنظیمات پروفایل
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className={menuItemClass}>
              <Link to="/install">
                <Download className="me-2 h-4 w-4 shrink-0" />
                {t("nav.install")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {auth.token ? (
              <DropdownMenuItem
                className={`${menuItemClass} text-destructive focus:text-destructive`}
                onClick={() => {
                  auth.logout();
                }}
              >
                <LogOut className="me-2 h-4 w-4 shrink-0" />
                {t("header.signOut")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild className={menuItemClass}>
                <Link to="/login">
                  <LogOut className="me-2 h-4 w-4 shrink-0" />
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
