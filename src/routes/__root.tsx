import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";
import { AppQueryProvider } from "@/lib/query";
import { AuthProvider } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-extrabold text-gradient-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">صفحه پیدا نشد</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          صفحه‌ای که دنبال آن هستید وجود ندارد.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          بازگشت به خانه
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Threadly — Build, Ask, Answer" },
      {
        name: "description",
        content:
          "Threadly is a community forum for PC builders: ask questions, share builds, and get expert answers.",
      },
      { name: "robots", content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" },
      { name: "theme-color", content: "#f97316" },
      { name: "color-scheme", content: "dark light" },
      { name: "application-name", content: "Threadly" },
      { name: "google", content: "notranslate" },

      // Open Graph (social share)
      { property: "og:site_name", content: "Threadly" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:title", content: "Threadly — Build, Ask, Answer" },
      {
        property: "og:description",
        content:
          "Threadly is a community forum for PC builders: ask questions, share builds, and get expert answers.",
      },

      // Twitter cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Threadly — Build, Ask, Answer" },
      {
        name: "twitter:description",
        content:
          "Threadly is a community forum for PC builders: ask questions, share builds, and get expert answers.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isAuthRoute) {
    return (
      <AppQueryProvider>
        <AuthProvider>
          <I18nProvider>
            <div className="relative z-10 min-h-screen">
              <Outlet />
              <Toaster />
            </div>
          </I18nProvider>
        </AuthProvider>
      </AppQueryProvider>
    );
  }

  return (
    <AppQueryProvider>
      <AuthProvider>
        <I18nProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <div className="relative z-10 flex min-w-0 flex-1 flex-col">
                <AppHeader />
                <main className="flex-1">
                  <Outlet />
                </main>
              </div>
            </div>
            <Toaster />
          </SidebarProvider>
        </I18nProvider>
      </AuthProvider>
    </AppQueryProvider>
  );
}
