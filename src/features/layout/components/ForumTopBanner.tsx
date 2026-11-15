import { useI18n } from "@/lib/i18n";

/** Site-wide title strip for انجمن فاطر (shown above the main header). */
export function ForumTopBanner() {
  const { t } = useI18n();
  return (
    <div className="shrink-0 border-b border-primary/25 bg-gradient-to-l from-primary/12 via-transparent to-primary/8 px-3 py-2.5 text-center text-sm font-bold tracking-tight text-foreground md:px-6 md:text-base">
      {t("site.forumBanner")}
    </div>
  );
}
