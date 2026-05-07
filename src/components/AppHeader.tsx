import { Link } from "@tanstack/react-router";
import { Moon, Sun, PlusCircle, User, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function AppHeader() {
  const [dark, setDark] = useState(true);
  const { t } = useI18n();
  const auth = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-3 backdrop-blur-xl md:px-6">
      <SidebarTrigger />

      <div className="flex items-center gap-1 ms-auto">
        <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} aria-label={t("header.toggleTheme")}>
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button asChild variant="hero" size="sm" className="hidden md:inline-flex">
          <Link to="/new">
            <PlusCircle className="h-4 w-4" />
            {t("nav.newThread")}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ms-1 flex items-center gap-2 rounded-full border border-border/60 p-1 ps-3 transition hover:bg-muted">
              <span className="hidden text-sm font-medium md:inline">{auth.user?.name ?? t("header.guestUser")}</span>
              <Avatar className="h-8 w-8 ring-2 ring-primary/40">
                {auth.user?.avatarUrl ? <AvatarImage src={auth.user.avatarUrl} alt={auth.user.name} /> : null}
                <AvatarFallback className="bg-gradient-primary text-xs font-bold text-primary-foreground">
                  {(auth.user?.name?.slice(0, 2) ?? "GU").toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {auth.user?.avatarUrl ? <AvatarImage src={auth.user.avatarUrl} alt={auth.user.name} /> : null}
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {(auth.user?.name?.slice(0, 2) ?? "GU").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{auth.user?.name ?? t("header.guestUser")}</span>
                <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
                  {auth.user?.role ?? t("header.member")}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={auth.user ? "/users/$id" : "/login"} params={auth.user ? { id: auth.user.id } : undefined}>
                <User className="me-2 h-4 w-4" />
                {t("header.profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/change-password">
                <Settings className="me-2 h-4 w-4" />
                تغییر رمز عبور
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={auth.user ? "/settings" : "/login"}>
                <Settings className="me-2 h-4 w-4" />
                تنظیمات پروفایل
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {auth.token ? (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  auth.logout();
                }}
              >
                <LogOut className="me-2 h-4 w-4" />
                {t("header.signOut")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link to="/login">
                  <LogOut className="me-2 h-4 w-4" />
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
