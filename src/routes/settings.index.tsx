import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api, type ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/settings/")({
  head: () => {
    const seo = buildSeo({
      title: "تنظیمات پروفایل",
      description: "ویرایش پروفایل کاربری در Threadly.",
      path: "/settings",
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  const auth = useAuth();

  const samplesQ = useQuery({
    queryKey: ["avatarSamples"],
    queryFn: () => api<{ items: { url: string }[] }>("/api/users/avatar-samples"),
  });

  if (!auth.token || !auth.user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-card">
          <p className="text-sm text-muted-foreground">برای ویرایش پروفایل وارد شوید.</p>
          <Button asChild className="mt-4" variant="hero">
            <Link to="/login">ورود</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <Link to="/threads" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4" /> بازگشت
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
        <div className="border-b border-border/60 bg-gradient-to-l from-primary/10 to-transparent p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/30">
              {auth.user.avatarUrl ? <AvatarImage src={auth.user.avatarUrl} alt={auth.user.name} /> : null}
              <AvatarFallback className="bg-gradient-primary text-lg font-extrabold text-primary-foreground">
                {(auth.user.name?.slice(0, 2) ?? "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold">عکس پروفایل</h1>
              <p className="mt-1 text-sm text-muted-foreground">می‌توانید از آواتارهای نمونه انتخاب کنید یا تصویر آپلود کنید.</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="text-sm font-extrabold">آپلود تصویر</p>
            <p className="mt-1 text-xs text-muted-foreground">PNG/JPG/WebP تا ۲ مگابایت</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                id="avatarUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.currentTarget.value = "";
                  if (!file) return;
                  const fd = new FormData();
                  fd.append("avatar", file);
                  try {
                    await api<{ avatarUrl: string | null }>("/api/users/me/avatar", { method: "POST", auth: true, body: fd });
                    await auth.refreshMe();
                    toast.success("عکس پروفایل به‌روزرسانی شد");
                  } catch (err) {
                    const apiErr = err as ApiError;
                    toast.error(apiErr?.message ?? "آپلود ناموفق بود");
                  }
                }}
              />
              <Button asChild variant="outline">
                <label htmlFor="avatarUpload" className="cursor-pointer">
                  <Camera className="h-4 w-4" /> انتخاب فایل
                </label>
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  try {
                    await api<{ avatarUrl: string | null }>("/api/users/me/avatar", { method: "POST", auth: true, body: new FormData() });
                    await auth.refreshMe();
                    toast.success("عکس پروفایل حذف شد");
                  } catch {}
                }}
              >
                حذف عکس
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border/60 bg-card p-4 shadow-card">
            <p className="text-sm font-extrabold">آواتارهای نمونه</p>
            <p className="mt-1 text-xs text-muted-foreground">برای انتخاب کلیک کنید</p>

            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
              {samplesQ.isLoading
                ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-14 w-14 rounded-full" />)
                : (samplesQ.data?.items ?? []).map((s) => (
                    <button
                      key={s.url}
                      type="button"
                      className="group rounded-full ring-offset-background transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
                      onClick={async () => {
                        try {
                          await api<{ avatarUrl: string | null }>("/api/users/me/avatar-sample", {
                            method: "POST",
                            auth: true,
                            body: JSON.stringify({ url: s.url }),
                          });
                          await auth.refreshMe();
                          toast.success("آواتار انتخاب شد");
                        } catch (err) {
                          const apiErr = err as ApiError;
                          toast.error(apiErr?.message ?? "عملیات ناموفق بود");
                        }
                      }}
                      title="انتخاب آواتار"
                    >
                      <img src={s.url} alt="sample avatar" className="h-14 w-14 rounded-full border border-border/60" />
                    </button>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

