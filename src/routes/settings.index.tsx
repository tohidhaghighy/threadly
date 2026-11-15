import { createFileRoute } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { buildSeo } from "@/features/seo/seo";
import { PAGE_SEO_KEYS, useStaticPageSeo } from "@/features/seo/page-seo";
import { PageBackLink } from "@/features/layout/components/PageBackLink";
import { AuthGate } from "@/features/auth/components/AuthGate";
import { PageSection } from "@/features/layout/components/PageSection";
import { ProfileContactForm } from "@/features/users/components/ProfileContactForm";
import { AvatarPicker } from "@/features/users/components/AvatarPicker";
import { pageContainerClasses, cardShellClasses } from "@/features/layout/page-styles";

export const Route = createFileRoute("/settings/")({
  head: () => {
    const seo = buildSeo({
      title: "تنظیمات پروفایل",
      description: "ویرایش پروفایل کاربری در انجمن فاطر.",
      path: "/settings",
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  useStaticPageSeo(PAGE_SEO_KEYS.settings, {
    title: "تنظیمات پروفایل",
    description: "ویرایش پروفایل کاربری در انجمن فاطر.",
    path: "/settings",
    noindex: true,
  });
  const auth = useAuth();

  return (
    <AuthGate
      ready={auth.ready}
      isAuthenticated={!!auth.token}
      message="برای ویرایش پروفایل وارد شوید."
    >
      {!auth.user ? (
        <div className={pageContainerClasses}>
          <div className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-card">
            <p className="text-sm text-muted-foreground">در حال بارگذاری پروفایل...</p>
          </div>
        </div>
      ) : (
        <div className={pageContainerClasses}>
          <PageBackLink to="/threads" label="بازگشت" />

          <div className="mt-4 space-y-6">
            <div className={cardShellClasses}>
              <ProfileContactForm user={auth.user} onSaved={auth.refreshMe} />
            </div>

            <PageSection
              title="عکس پروفایل"
              description="آواتار نمونه یا آپلود تصویر"
              icon={<UserCircle className="h-5 w-5" />}
            >
              <AvatarPicker onChanged={auth.refreshMe} />
            </PageSection>
          </div>
        </div>
      )}
    </AuthGate>
  );
}
