import { Link } from "@tanstack/react-router";
import { Search, Bell, Moon, Sun, PlusCircle, User, LogOut, Settings, Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-3 backdrop-blur-xl md:px-6">
      <SidebarTrigger />

      <div className="relative mx-auto w-full max-w-xl">
        <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="جستجو در گفتگوها، تگ‌ها و کاربران..."
          className="h-10 rounded-full border-border/70 bg-muted/40 pe-10 ps-4 focus-visible:ring-primary"
        />
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} aria-label="تغییر تم">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-primary shadow-glow" />
        </Button>

        <Button asChild variant="hero" size="sm" className="hidden md:inline-flex">
          <Link to="/new">
            <PlusCircle className="h-4 w-4" />
            موضوع جدید
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ms-1 flex items-center gap-2 rounded-full border border-border/60 p-1 ps-3 transition hover:bg-muted">
              <span className="hidden text-sm font-medium md:inline">آرش رضایی</span>
              <Avatar className="h-8 w-8 ring-2 ring-primary/40">
                <AvatarFallback className="bg-gradient-primary text-xs font-bold text-primary-foreground">
                  AR
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">AR</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">آرش رضایی</span>
                <Badge variant="secondary" className="mt-1 w-fit text-[10px]">پرو بیلدر</Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="me-2 h-4 w-4" />پروفایل</DropdownMenuItem>
            <DropdownMenuItem><Bookmark className="me-2 h-4 w-4" />ذخیره‌شده‌ها</DropdownMenuItem>
            <DropdownMenuItem><Settings className="me-2 h-4 w-4" />تنظیمات</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive"><LogOut className="me-2 h-4 w-4" />خروج</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
