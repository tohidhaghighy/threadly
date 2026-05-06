import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bold, Italic, List, Link as LinkIcon, Image as ImageIcon, Code2, Upload, Eye, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { categories as mockCategories } from "@/lib/mock-data";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { ApiError } from "@/lib/api";
import { useCategories } from "@/lib/categories";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "ایجاد موضوع — Threadly" },
      {
        name: "description",
        content: "ایجاد سؤال جدید در Threadly. موضوعات جدید پس از تأیید مدیر منتشر می‌شوند.",
      },
    ],
  }),
  component: NewTopic,
});

function NewTopic() {
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const auth = useAuth();
  const { t } = useI18n();
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data?.items ?? [];
  const iconByTitle = new Map(mockCategories.map((c) => [c.title, c.icon]));

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

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-warning/15">
          <Clock className="h-10 w-10 text-warning" />
        </div>
        <Badge className="mt-4 bg-warning/20 text-warning border border-warning/30">در انتظار تأیید</Badge>
        <h1 className="mt-4 text-3xl font-extrabold">موضوع شما ارسال شد</h1>
        <p className="mt-2 text-muted-foreground">
          پس از بررسی مدیران، موضوع شما منتشر می‌شود (معمولاً کمتر از ۲۴ ساعت).
        </p>
        <Button variant="hero" className="mt-6" onClick={() => setSubmitted(false)}>
          ایجاد موضوع جدید
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
            toast.error("لطفاً برای ایجاد موضوع وارد شوید.");
            return;
          }
          if (!category) return;

          const trimmedTitle = title.trim();
          const trimmedContent = content.trim();
          if (trimmedTitle.length < 10) {
            toast.error("عنوان باید حداقل ۱۰ کاراکتر باشد.");
            return;
          }
          if (trimmedContent.length < 10) {
            toast.error("جزئیات باید حداقل ۱۰ کاراکتر باشد.");
            return;
          }

          try {
            const created = await api<{ id: string; status: "pending" }>(`/api/threads`, {
              method: "POST",
              auth: true,
              body: JSON.stringify({
                title: trimmedTitle,
                content: trimmedContent,
                category,
                tags: tags
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean),
                language: "fa",
              }),
            });

            if (images.length > 0) {
              const fd = new FormData();
              for (const f of images) fd.append("images", f);
              await api<{ attachments: unknown[] }>(`/api/threads/${created.id}/images`, {
                method: "POST",
                auth: true,
                body: fd,
              });
            }

            setSubmitted(true);
          toast.success(t("new.toastSubmitted"));
          } catch (err) {
            const e = err as ApiError;
            if (e?.status === 400) toast.error("اطلاعات وارد شده معتبر نیست.");
            else if (e?.status === 401) toast.error("جلسه شما منقضی شده است. دوباره وارد شوید.");
            else toast.error(e?.message ?? "خطا در ارسال موضوع");
          }
        }}
        className="mt-8 space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card md:p-8"
      >
        <div className="grid gap-2">
          <Label htmlFor="title" className="text-sm font-semibold">Title</Label>
          <Input
            id="title"
            required
            placeholder="e.g. PC won’t boot after installing RTX 4080"
            className="h-12 border-border/70 bg-background/70 text-base shadow-sm backdrop-blur focus-visible:ring-primary/60"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Pick a clear title (at least 10 characters)</p>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-semibold">Category</Label>
          <Select required onValueChange={(v) => setCategory(categories.find((c) => c.id === v)?.title ?? null)}>
            <SelectTrigger className="h-12 border-border/70 bg-background/70 shadow-sm backdrop-blur focus:ring-primary/60">
              <SelectValue placeholder="Select a category" />
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
          <Label className="text-sm font-semibold">Tags</Label>
          <Input
            placeholder="Comma-separated: GPU, Cooling, FPS"
            className="h-12 border-border/70 bg-background/70 shadow-sm backdrop-blur focus-visible:ring-primary/60"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-semibold">Details</Label>
          <div className="overflow-hidden rounded-lg border border-border/70 bg-background/70 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Bold className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Italic className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><List className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><LinkIcon className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Code2 className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><ImageIcon className="h-4 w-4" /></Button>
              <div className="ms-auto">
                <Button type="button" variant="ghost" size="sm"><Eye className="h-4 w-4" /> Preview</Button>
              </div>
            </div>
            <Textarea
              required
              placeholder="Write the full details: specs, errors, and what you already tried..."
              className="min-h-64 resize-none border-0 bg-transparent text-base focus-visible:ring-0"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-semibold">Images</Label>
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
                  toast.error("Only image files are allowed.");
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
              <p className="mt-2 text-sm font-medium">Click to select images</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Any image format (PNG, JPG, GIF, WEBP, SVG, ...) — UI only
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
                      Remove
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
