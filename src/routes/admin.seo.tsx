import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { buildSeo } from "@/lib/seo";
import {
  formatKeywordsInput,
  parseKeywordsInput,
  type PageSeoItem,
} from "@/lib/page-seo";
import { useAdminPageSeoList, useUpdateAdminPageSeo } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor } from "@/components/shared/rich-text";

export const Route = createFileRoute("/admin/seo")({
  head: () => {
    const seo = buildSeo({
      title: "مدیریت SEO صفحات",
      description: "ویرایش عنوان، توضیحات و برچسب‌های SEO برای صفحات عمومی.",
      path: "/admin/seo",
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: AdminSeoPage,
});

function AdminSeoPage() {
  const auth = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PageSeoItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formTitleAbsolute, setFormTitleAbsolute] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formKeywords, setFormKeywords] = useState("");
  const [formNoindex, setFormNoindex] = useState(false);
  const [formFooterBlurb, setFormFooterBlurb] = useState("");

  const pagesQuery = useAdminPageSeoList(auth.isAdmin);
  const updateMut = useUpdateAdminPageSeo();

  const items = useMemo(() => pagesQuery.data?.items ?? [], [pagesQuery.data?.items]);

  const openEdit = (p: PageSeoItem) => {
    setEditing(p);
    setFormTitle(p.title ?? "");
    setFormTitleAbsolute(p.titleAbsolute ?? "");
    setFormDescription(p.description);
    setFormKeywords(formatKeywordsInput(p.keywords));
    setFormNoindex(p.noindex);
    setFormFooterBlurb(p.footerBlurb ?? "");
    setEditOpen(true);
  };

  if (!auth.isAdmin) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
        <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground shadow-card">
          دسترسی مدیریت لازم است.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        بازگشت به پنل مدیریت
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Globe className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold">مدیریت SEO صفحات</h1>
          <p className="text-sm text-muted-foreground">عنوان، توضیحات متا و برچسب‌های SEO هر صفحه</p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-start">صفحه</TableHead>
              <TableHead className="text-start">مسیر</TableHead>
              <TableHead className="text-start">توضیحات</TableHead>
              <TableHead className="text-start">برچسب‌ها</TableHead>
              <TableHead className="text-end">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagesQuery.isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : items.map((p) => (
                  <TableRow key={p.pageKey} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-semibold">{p.label}</div>
                      {p.noindex ? (
                        <Badge variant="outline" className="mt-1 text-xs">
                          noindex
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.path}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.keywords.slice(0, 4).map((k) => (
                          <Badge key={k} variant="secondary" className="text-[10px]">
                            {k}
                          </Badge>
                        ))}
                        {p.keywords.length > 4 ? (
                          <Badge variant="outline" className="text-[10px]">
                            +{p.keywords.length - 4}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" /> ویرایش
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>ویرایش SEO — {editing?.label}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان کوتاه (با نام سایت)</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="مثال: گفتگوها"
              />
            </div>
            <div className="space-y-2">
              <Label>عنوان کامل (اختیاری — بدون پسوند سایت)</Label>
              <Input
                value={formTitleAbsolute}
                onChange={(e) => setFormTitleAbsolute(e.target.value)}
                placeholder="مثال: انجمن فاطر — گفتگو و ساخت کیس"
              />
            </div>
            <div className="space-y-2">
              <Label>توضیحات متا (description)</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="min-h-24"
                placeholder="توضیح کوتاه برای موتورهای جستجو…"
              />
            </div>
            <div className="space-y-2">
              <Label>برچسب‌های SEO (با ویرگول جدا کنید)</Label>
              <Input
                value={formKeywords}
                onChange={(e) => setFormKeywords(e.target.value)}
                placeholder="کیس، مونتاژ، گیمینگ"
              />
            </div>
            <div className="space-y-2">
              <Label>متن SEO بالای فوتر (HTML — لینک، لیست، عنوان)</Label>
              <RichTextEditor
                value={formFooterBlurb}
                onChange={setFormFooterBlurb}
                variant="admin"
                minHeightClassName="min-h-48"
                placeholder="متن بلند برای SEO در پایین صفحه را بنویسید…"
              />
              <p className="text-xs text-muted-foreground">
                فقط تگ‌های امن (لینک، لیست، bold، عنوان) ذخیره می‌شود. اسکریپت و HTML خطرناک حذف می‌شود.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div>
                <p className="text-sm font-semibold">عدم ایندکس (noindex)</p>
                <p className="text-xs text-muted-foreground">صفحات ورود و تنظیمات معمولاً noindex هستند</p>
              </div>
              <Switch checked={formNoindex} onCheckedChange={setFormNoindex} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
              بستن
            </Button>
            <Button
              variant="hero"
              type="button"
              disabled={updateMut.isPending || !formDescription.trim() || !editing}
              onClick={() => {
                if (!editing) return;
                updateMut.mutate(
                  {
                    pageKey: editing.pageKey,
                    payload: {
                      title: formTitle.trim() || null,
                      titleAbsolute: formTitleAbsolute.trim() || null,
                      description: formDescription.trim(),
                      keywords: parseKeywordsInput(formKeywords),
                      noindex: formNoindex,
                      footerBlurb: formFooterBlurb.trim() || null,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success("تنظیمات SEO ذخیره شد");
                      setEditOpen(false);
                      setEditing(null);
                    },
                    onError: () => toast.error("ذخیره SEO ناموفق بود"),
                  },
                );
              }}
            >
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
