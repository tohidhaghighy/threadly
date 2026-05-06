import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageSquare, PlusCircle, ShieldCheck, Flame, Bookmark, Users, Settings, Cpu } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { categories } from "@/lib/mock-data";

const mainItems = [
  { title: "خانه", url: "/", icon: Home },
  { title: "گفتگوها", url: "/threads", icon: MessageSquare },
  { title: "داغ‌ترین‌ها", url: "/threads", icon: Flame },
  { title: "ذخیره شده‌ها", url: "/threads", icon: Bookmark },
  { title: "ایجاد موضوع", url: "/new", icon: PlusCircle },
];

const adminItems = [
  { title: "پنل مدیریت", url: "/admin", icon: ShieldCheck },
  { title: "کاربران", url: "/admin", icon: Users },
  { title: "تنظیمات", url: "/admin", icon: Settings },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Cpu className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-base font-extrabold text-gradient-primary">پارس‌بیلد</span>
            <span className="text-[10px] text-muted-foreground">انجمن سازندگان کیس</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>پیمایش</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>دسته‌بندی‌ها</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.slice(0, 5).map((cat) => (
                <SidebarMenuItem key={cat.id}>
                  <SidebarMenuButton asChild>
                    <Link to="/threads">
                      <cat.icon />
                      <span>{cat.title}</span>
                      <span className="ms-auto text-[10px] text-muted-foreground">{cat.threads}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>مدیریت</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="rounded-lg bg-gradient-primary/10 border border-primary/20 p-3 group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-semibold text-foreground">عضویت پرمیوم</p>
          <p className="mt-1 text-[10px] text-muted-foreground">دسترسی به راهنماهای ویژه</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
