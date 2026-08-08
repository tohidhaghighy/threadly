import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Download,
  Share,
  MoreVertical,
  Smartphone,
  Monitor,
  Apple,
  Chrome,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildSeo } from "@/lib/seo";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { pageContainerClasses } from "@/styles/shared/page";

export const Route = createFileRoute("/install")({
  head: () => {
    const seo = buildSeo({
      title: "نصب اپلیکیشن",
      description: "راهنمای نصب انجمن فاطر روی گوشی و دسکتاپ به‌صورت Progressive Web App.",
      path: "/install",
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: InstallPage,
});

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-extrabold text-primary">
        {n.toLocaleString("fa-IR")}
      </span>
      <div className="min-w-0 flex-1 pb-5">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}

function InstallPage() {
  const { t } = useI18n();
  const { canPrompt, isInstalled, platform, install } = usePwaInstall();
  const [busy, setBusy] = useState(false);

  const onInstall = async () => {
    setBusy(true);
    try {
      const outcome = await install();
      if (outcome === "accepted") toast.success(t("install.toastAccepted"));
      else if (outcome === "dismissed") toast.message(t("install.toastDismissed"));
      else toast.message(t("install.toastUnavailable"));
    } finally {
      setBusy(false);
    }
  };

  const installButton =
    canPrompt ? (
      <Button className="mt-2 w-full sm:w-auto" variant="hero" disabled={busy} onClick={() => void onInstall()}>
        <Download className="h-4 w-4" />
        {t("install.cta")}
      </Button>
    ) : null;

  const guides: Array<{
    id: "android" | "ios" | "desktop";
    icon: ReactNode;
    title: string;
    content: ReactNode;
  }> = [
    {
      id: "android",
      icon: <Chrome className="h-5 w-5" />,
      title: t("install.androidTitle"),
      content: (
        <>
          <ol className="mt-4 list-none space-y-0">
            <Step n={1} title={t("install.android.step1Title")}>
              {t("install.android.step1Desc")}
            </Step>
            <Step n={2} title={t("install.android.step2Title")}>
              {t("install.android.step2Desc")}{" "}
              <MoreVertical className="inline h-3.5 w-3.5 align-text-bottom" />
            </Step>
            <Step n={3} title={t("install.android.step3Title")}>
              {t("install.android.step3Desc")}
            </Step>
            <Step n={4} title={t("install.android.step4Title")}>
              {t("install.android.step4Desc")}
            </Step>
          </ol>
          {installButton}
        </>
      ),
    },
    {
      id: "ios",
      icon: <Apple className="h-5 w-5" />,
      title: t("install.iosTitle"),
      content: (
        <ol className="mt-4 list-none space-y-0">
          <Step n={1} title={t("install.ios.step1Title")}>
            {t("install.ios.step1Desc")}
          </Step>
          <Step n={2} title={t("install.ios.step2Title")}>
            {t("install.ios.step2Desc")} <Share className="inline h-3.5 w-3.5 align-text-bottom" />
          </Step>
          <Step n={3} title={t("install.ios.step3Title")}>
            {t("install.ios.step3Desc")}
          </Step>
          <Step n={4} title={t("install.ios.step4Title")}>
            {t("install.ios.step4Desc")}
          </Step>
        </ol>
      ),
    },
    {
      id: "desktop",
      icon: <Monitor className="h-5 w-5" />,
      title: t("install.desktopTitle"),
      content: (
        <>
          <ol className="mt-4 list-none space-y-0">
            <Step n={1} title={t("install.desktop.step1Title")}>
              {t("install.desktop.step1Desc")}
            </Step>
            <Step n={2} title={t("install.desktop.step2Title")}>
              {t("install.desktop.step2Desc")}
            </Step>
            <Step n={3} title={t("install.desktop.step3Title")}>
              {t("install.desktop.step3Desc")}
            </Step>
          </ol>
          {installButton}
        </>
      ),
    },
  ];

  guides.sort((a, b) => Number(b.id === platform) - Number(a.id === platform));

  return (
    <div className={pageContainerClasses}>
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-card sm:rounded-3xl sm:p-8">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="relative">
          <Badge className="border border-primary/30 bg-primary/20 text-primary">
            <Smartphone className="me-1 h-3 w-3" />
            {t("install.badge")}
          </Badge>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
            {t("install.title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            {t("install.subtitle")}
          </p>
          {platform === "ios" ? (
            <p className="mt-2 text-xs font-medium text-primary sm:text-sm">{t("install.openInSafari")}</p>
          ) : platform === "android" ? (
            <p className="mt-2 text-xs font-medium text-primary sm:text-sm">{t("install.openInChrome")}</p>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {isInstalled ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm font-semibold text-success">
                <CheckCircle2 className="h-4 w-4" />
                {t("install.alreadyInstalled")}
              </div>
            ) : canPrompt ? (
              <Button variant="hero" size="lg" className="w-full sm:w-auto" disabled={busy} onClick={() => void onInstall()}>
                <Download className="h-4 w-4" />
                {t("install.cta")}
              </Button>
            ) : (
              <Button asChild variant="hero" size="lg" className="w-full sm:w-auto">
                <a href="#guide">
                  <Download className="h-4 w-4" />
                  {t("install.seeGuide")}
                </a>
              </Button>
            )}
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/">{t("install.backHome")}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div id="guide" className="mt-6 scroll-mt-24 space-y-4 sm:mt-8">
        {guides.map((guide) => (
          <GuideCard
            key={guide.id}
            active={guide.id === platform}
            icon={guide.icon}
            title={guide.title}
            yourDeviceLabel={t("install.yourDevice")}
          >
            {guide.content}
          </GuideCard>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground sm:p-5">
        <p className="font-semibold text-foreground">{t("install.tipsTitle")}</p>
        <ul className="mt-2 list-disc space-y-1 pe-5">
          <li>{t("install.tip1")}</li>
          <li>{t("install.tip2")}</li>
          <li>{t("install.tip3")}</li>
        </ul>
      </div>
    </div>
  );
}

function GuideCard({
  title,
  icon,
  active,
  yourDeviceLabel,
  children,
}: {
  title: string;
  icon: ReactNode;
  active?: boolean;
  yourDeviceLabel: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-card sm:p-6",
        active ? "border-primary/50 ring-1 ring-primary/20" : "border-border/60",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </span>
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {active ? (
          <Badge variant="secondary" className="ms-auto bg-primary/15 text-primary">
            {yourDeviceLabel}
          </Badge>
        ) : null}
      </div>
      {children}
    </section>
  );
}
