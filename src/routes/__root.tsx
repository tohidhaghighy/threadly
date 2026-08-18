import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AppHeader } from "@/components/AppHeader";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { AppQueryProvider } from "@/lib/query";
import { AuthProvider } from "@/lib/auth";
import { buildSeo } from "@/lib/seo";
import { ForumTopBanner } from "@/components/ForumTopBanner";
import { SiteSeoBlurb } from "@/components/SiteSeoBlurb";
import { PhoneRequiredBanner } from "@/components/shared/profile/PhoneRequiredBanner";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { PwaRegister } from "@/components/PwaRegister";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { BottomMegaMenu } from "@/components/BottomMegaMenu";

const GTM_ID = "GTM-MZ6KVF7C";
const GTM_HEAD_SCRIPT = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;

function SiteFooter() {
  const { t } = useI18n();
  const line = t("site.brand");
  const marker = "Threadly";
  const i = line.lastIndexOf(marker);
  return (
    <footer className="border-t border-border/60 bg-background/60 px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
      {i === -1 ? (
        line
      ) : (
        <>
          {line.slice(0, i)}
          <a
            href="https://github.com/tohidhaghighy/threadly"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-foreground hover:underline"
          >
            {marker}
          </a>
          {line.slice(i + marker.length)}
        </>
      )}
    </footer>
  );
}

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

const ROOT_DESCRIPTION =
  "انجمن گفتگوی فاطر برای سازندگان کیس: پرسش، اشتراک اسمبل و پاسخ از جامعهٔ کاربران فاطر.";

export const Route = createRootRoute({
  head: () => {
    const seo = buildSeo({
      titleAbsolute: "انجمن فاطر — گفتگو",
      description: ROOT_DESCRIPTION,
      path: "/",
      type: "website",
      locale: "fa_IR",
    });
    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { name: "theme-color", content: "#f97316" },
        { name: "color-scheme", content: "light dark" },
        { name: "application-name", content: "انجمن فاطر" },
        { name: "apple-mobile-web-app-title", content: "انجمن فاطر" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "format-detection", content: "telephone=no" },
        { name: "google", content: "notranslate" },
        ...seo.meta,
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "shortcut icon", href: "/favicon.svg" },
        { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png", sizes: "180x180" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "dns-prefetch", href: "https://www.googletagmanager.com" },
        { rel: "preconnect", href: "https://www.googletagmanager.com" },
        ...seo.links,
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: GTM_HEAD_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  // Keep Auth/Query/I18n mounted across login ↔ app so the session is not lost on navigate.
  return (
    <AppQueryProvider>
      <AuthProvider>
        <I18nProvider>
          {isAuthRoute ? (
            <div className="relative z-10 min-h-screen overflow-x-clip">
              <ForumTopBanner />
              <Outlet />
              <Toaster />
              <PwaInstallBanner />
              <PwaRegister />
            </div>
          ) : (
            <>
              <div className="relative z-10 flex min-h-screen w-full flex-col overflow-x-clip pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))]">
                <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 shadow-sm backdrop-blur-xl">
                  <ForumTopBanner />
                  <AppHeader />
                  <PhoneRequiredBanner />
                </div>
                <main className="min-w-0 flex-1 overflow-x-clip">
                  <Outlet />
                </main>
                <SiteSeoBlurb />
                <SiteFooter />
              </div>
              <BottomMegaMenu />
              <Toaster />
              <PwaInstallBanner />
              <PwaRegister />
            </>
          )}
        </I18nProvider>
      </AuthProvider>
    </AppQueryProvider>
  );
}
