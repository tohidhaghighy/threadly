import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Upload, CheckCircle2, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/shared/rich-text";
import { stripHtmlToText } from "@/lib/sanitize-html";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { categories as mockCategories } from "@/lib/mock-data";
import { toast } from "sonner";
import { createThread, uploadThreadImages } from "@/api/threads";
import { useAuth } from "@/lib/auth";
import { useI18n, tStatic } from "@/lib/i18n";
import type { ApiError } from "@/lib/api";
import { useCategories, useUserProfile } from "@/hooks/api";
import { buildSeo } from "@/lib/seo";
import { PAGE_SEO_KEYS, useStaticPageSeo } from "@/lib/page-seo";
import { needsPhoneForSupport } from "@/components/shared/profile/PhoneRequiredBanner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/new")({
  head: () => {
    const seo = buildSeo({
      titleAbsolute: tStatic("new.metaTitle"),
      description: tStatic("new.metaDescription"),
      path: "/new",
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: NewTopic,
});

function NewTopic() {
  useStaticPageSeo(PAGE_SEO_KEYS.new, {
    title: "ایجاد موضوع",
    description: tStatic("new.metaDescription"),
    path: "/new",
  });
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const auth = useAuth();
  const { t } = useI18n();
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data?.items ?? [];
  const iconByTitle = new Map(mockCategories.map((c) => [c.title, c.icon]));
  const profileQuery = useUserProfile(auth.user?.id ?? "", { enabled: !!auth.user });
  const mustSetPhone =
    !!auth.user && needsPhoneForSupport(profileQuery.data?.points ?? 0, auth.user.phone);

  const imagePreviews = useMemo(() => {
    const items = images.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    return items;
  }, [images]);

  // cleanup object URLs on unmount/change
  useEffect(() => {
    return () => {
      for (const it of imagePreviews) URL.revokeObjectURL(it.url);
    };
  }, [imagePreviews]);

  if (mustSetPhone) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/15">
          <Phone className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold">ثبت موبایل الزامی است</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          از سطح ۴ به بعد، ثبت موبایل اجباری است. برای ایجاد موضوع، ابتدا شماره موبایل را ثبت کنید تا پشتیبانی بتواند برای جوایز یا تماس با شما ارتباط بگیرد.
        </p>
        <Button asChild variant="hero" className="mt-6">
          <Link to="/settings">رفتن به تنظیمات</Link>
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-warning/15">
          <Clock className="h-10 w-10 text-warning" />
        </div>
        <Badge className="mt-4 bg-warning/20 text-warning border border-warning/30">
          {t("new.submittedBadge")}
        </Badge>
        <h1 className="mt-4 text-3xl font-extrabold">{t("new.submittedTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("new.submittedDesc")}</p>
        <Button variant="hero" className="mt-6" onClick={() => setSubmitted(false)}>
          {t("new.submittedAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">{t("new.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("new.subtitle")}</p>
        </div>
        <Badge variant="outline" className="border-warning/40 text-warning">
          <CheckCircle2 className="me-1 h-3 w-3" /> {t("new.requiresApproval")}
        </Badge>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!auth.token) {
            toast.error(t("new.toastLoginRequired"));
            return;
          }
          if (!category) return;

          const trimmedTitle = title.trim();
          const plainContent = stripHtmlToText(content);
          if (trimmedTitle.length < 10) {
            toast.error(t("new.errorTitleMin"));
            return;
          }
          if (plainContent.length < 10) {
            toast.error(t("new.errorContentMin"));
            return;
          }

          try {
            const created = await createThread({
              title: trimmedTitle,
              content: content.trim(),
              category,
              tags: selectedTags,
              language: "fa",
            });

            if (images.length > 0) {
              await uploadThreadImages(created.id, images);
            }

            setSubmitted(true);
          toast.success(t("new.toastSubmitted"));
          } catch (err) {
            const e = err as ApiError;
            if (e?.status === 400) toast.error(t("new.errorInvalidData"));
            else if (e?.status === 401) toast.error(t("new.errorSessionExpired"));
            else toast.error(e?.message ?? t("new.errorSubmitFailed"));
          }
        }}
        className="mt-8 space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card md:p-8"
      >
        <div className="grid gap-2">
          <Label htmlFor="title" className="text-sm font-semibold">{t("new.field.title")}</Label>
          <Input
            id="title"
            required
            placeholder={t("new.field.titlePlaceholder")}
            className="h-12 border-border/70 bg-background/70 text-base shadow-sm backdrop-blur focus-visible:ring-primary/60"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("new.field.titleHint")}</p>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-semibold">{t("new.field.category")}</Label>
          <Select required onValueChange={(v) => setCategory(categories.find((c) => c.id === v)?.title ?? null)}>
            <SelectTrigger className="h-12 border-border/70 bg-background/70 shadow-sm backdrop-blur focus:ring-primary/60">
              <SelectValue placeholder={t("new.field.categoryPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {(categoriesQuery.isLoading ? [] : categories).map((c) => {
                const Icon = iconByTitle.get(c.title);
                return (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {c.title}
                  </div>
                </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-semibold">{t("new.field.tags")}</Label>
          <div className="rounded-xl border border-border/70 bg-background/70 p-3 shadow-sm backdrop-blur">
            <div className="flex flex-wrap gap-2">
              {selectedTags.length ? (
                selectedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="group"
                    onClick={() => setSelectedTags((prev) => prev.filter((t2) => t2 !== tag))}
                    title="حذف تگ"
                  >
                    <Badge className="bg-primary/15 text-primary border border-primary/30 group-hover:bg-destructive/15 group-hover:text-destructive group-hover:border-destructive/30">
                      #{tag}
                    </Badge>
                  </button>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">{t("new.field.tagsPlaceholder")}</span>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                placeholder="افزودن تگ (Enter)"
                className="h-10 border-border/70 bg-background/60 shadow-none"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const tag = tagInput.trim().toLowerCase();
                  if (!tag) return;
                  setSelectedTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
                  setTagInput("");
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => {
                  const tag = tagInput.trim().toLowerCase();
                  if (!tag) return;
                  setSelectedTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
                  setTagInput("");
                }}
              >
                افزودن
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-semibold">{t("new.field.details")}</Label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder={t("new.field.detailsPlaceholder")}
            minHeightClassName="min-h-72"
            variant="user"
          />
          <p className="text-xs text-muted-foreground">
            می‌توانید از bold، لیست و لینک استفاده کنید. محتوای خطرناک به‌صورت خودکار حذف می‌شود.
          </p>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-semibold">{t("new.images")}</Label>
          <div className="rounded-lg border-2 border-dashed border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur transition hover:border-primary/50 hover:bg-primary/5">
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                const onlyImages = files.filter((f) => f.type.startsWith("image/"));
                if (onlyImages.length !== files.length) {
                  toast.error(t("new.imagesOnlyError"));
                }
                setImages((prev) => [...prev, ...onlyImages]);
                e.currentTarget.value = "";
              }}
            />

            <label
              htmlFor="images"
              className="flex cursor-pointer flex-col items-center justify-center px-4 py-6 text-center"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">{t("new.imagesCta")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("new.imagesHint")}
              </p>
            </label>

            {images.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imagePreviews.map(({ file, url }) => (
                  <div key={`${file.name}-${file.size}-${file.lastModified}`} className="group relative overflow-hidden rounded-lg border border-border/60 bg-card">
                    <img src={url} alt={file.name} className="aspect-square w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="line-clamp-1 text-[11px] font-medium text-white">{file.name}</p>
                    </div>
                    <button
                      type="button"
                      className="absolute end-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100"
                      onClick={() => {
                        URL.revokeObjectURL(url);
                        setImages((prev) => prev.filter((f) => f !== file));
                      }}
                    >
                      {t("new.remove")}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-6">
          <Button type="button" variant="ghost">{t("common.cancel")}</Button>
          <Button type="submit" variant="hero">{t("common.submitForReview")}</Button>
        </div>
      </form>
    </div>
  );
}
