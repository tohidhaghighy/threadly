import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageSquare, PlusCircle, ShieldCheck, Users, Settings, Cpu, Tags, HelpCircle, MessageSquareText } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { useCategories } from "@/lib/categories";
import { categories as mockCategories } from "@/lib/mock-data";

export function AppSidebar() {
  const { t, dir } = useI18n();
  const auth = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (path: string) => currentPath === path;

  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data?.items ?? [];
  const iconByTitle = new Map(mockCategories.map((c) => [c.title, c.icon]));

  return (
    <Sidebar collapsible="icon" side={dir === "rtl" ? "right" : "left"}>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Cpu className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-[11px] font-extrabold leading-snug text-gradient-primary md:text-xs">{t("site.headerbrand")}</span>
            {t("site.tagline").trim() ? (
              <span className="text-[10px] text-muted-foreground">{t("site.tagline")}</span>
            ) : null}
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { title: t("nav.home"), url: "/", icon: Home },
                { title: t("nav.threads"), url: "/threads", icon: MessageSquare },
                { title: t("nav.newThread"), url: "/new", icon: PlusCircle },
                { title: t("nav.users"), url: "/users", icon: Users },
              ].map((item) => (
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
          <SidebarGroupLabel>{t("nav.categories")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((cat) => {
                const Icon = iconByTitle.get(cat.title) ?? HelpCircle;
                return (
                <SidebarMenuItem key={cat.id}>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/threads"
                      search={{ category: cat.title }}
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <Icon />
                      <span>{cat.title}</span>
                      <span className="ms-auto text-[10px] text-muted-foreground">
                        {cat.threadsCount.toLocaleString("fa-IR")}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {auth.isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>{t("nav.admin")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  { title: t("nav.admin"), url: "/admin", icon: ShieldCheck },
                  { title: "دسته‌بندی‌ها", url: "/admin/categories", icon: Tags },
                  { title: "کامنت‌ها", url: "/admin/comments", icon: MessageSquareText },
                  { title: t("nav.settings"), url: "/admin", icon: Settings },
                ].map((item) => (
                  <SidebarMenuItem key={item.url}>
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
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="rounded-lg bg-gradient-primary/10 border border-primary/20 p-3 group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-semibold text-foreground">{t("footer.freeAccess")}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{t("footer.freeAccessDesc")}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
