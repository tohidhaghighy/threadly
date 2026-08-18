import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useI18n } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";

const DISMISS_KEY = "threadly_pwa_banner_dismissed_at";
const DISMISS_DAYS = 7;

function wasDismissedRecently() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Compact mobile prompt pointing users to the install guide / native install.
 * Hidden when already installed, dismissed, or on the install page.
 */
export function PwaInstallBanner() {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { canPrompt, isInstalled, install } = usePwaInstall();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isMobile || isInstalled || pathname === "/install" || wasDismissedRecently()) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [isMobile, isInstalled, pathname]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const onInstall = async () => {
    setBusy(true);
    try {
      await install();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-40 px-3 sm:hidden">
      <div className="pointer-events-auto mx-auto mb-2 flex max-w-lg items-start gap-3 rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-glow backdrop-blur-xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug">{t("install.bannerTitle")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("install.bannerDesc")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {canPrompt ? (
              <Button size="sm" variant="hero" disabled={busy} onClick={() => void onInstall()}>
                {t("install.cta")}
              </Button>
            ) : null}
            <Button asChild size="sm" variant={canPrompt ? "outline" : "hero"}>
              <Link to="/install">{t("install.seeGuide")}</Link>
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={t("install.bannerDismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
