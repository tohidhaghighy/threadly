import { createFileRoute } from "@tanstack/react-router";
import { FolderTree, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { buildSeo } from "@/lib/seo";
import { formatKeywordsInput, parseKeywordsInput } from "@/lib/page-seo";

type CategoryAdminItem = {
  id: string;
  title: string;
  description: string | null;
  seoKeywords: string[];
  order: number;
  isActive: boolean;
  threadsCount: number;
  createdAt: string;
  updatedAt: string;
};

export const Route = createFileRoute("/admin/categories")({
  head: () => {
    const seo = buildSeo({
      title: "مدیریت دسته‌بندی‌ها",
      description: "مدیریت دسته‌بندی‌ها در انجمن فاطر.",
      path: "/admin/categories",
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const auth = useAuth();
  const qc = useQueryClient();
  const { t } = useI18n();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryAdminItem | null>(null);
  const [patchingId, setPatchingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSeoKeywords, setFormSeoKeywords] = useState("");
  const [formOrder, setFormOrder] = useState("0");
  const [formActive, setFormActive] = useState(true);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormSeoKeywords("");
    setFormOrder("0");
    setFormActive(true);
  };

  const categoriesQuery = useQuery({
    queryKey: ["adminCategories"],
    queryFn: async () => api<{ items: CategoryAdminItem[] }>(`/api/admin/categories`, { auth: true }),
    enabled: auth.isAdmin,
  });

  const items = useMemo(() => categoriesQuery.data?.items ?? [], [categoriesQuery.data?.items]);

  const maxOrder = useMemo(() => items.reduce((m, c) => Math.max(m, c.order ?? 0), 0), [items]);

  const createMut = useMutation({
    mutationFn: async () => {
      const title = formTitle.trim();
      const description = formDescription.trim();
      const order = Number(formOrder);
      return api<{ id: string }>(`/api/admin/categories`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          title,
          description: description ? description : undefined,
          seoKeywords: parseKeywordsInput(formSeoKeywords),
          order: Number.isFinite(order) ? order : 0,
          isActive: formActive,
        }),
      });
    },
    onSuccess: async () => {
      toast.success(t("adminCategories.toastCreated"));
      setCreateOpen(false);
      resetForm();
      await qc.invalidateQueries({ queryKey: ["adminCategories"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: unknown) => toast.error((e as { message?: string })?.message ?? t("adminCategories.errorCreate")),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error("no category");
      const title = formTitle.trim();
      const description = formDescription.trim();
      const order = Number(formOrder);
      return api(`/api/admin/categories/${editing.id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({
          title,
          description,
          seoKeywords: parseKeywordsInput(formSeoKeywords),
          order: Number.isFinite(order) ? order : 0,
          isActive: formActive,
        }),
      });
    },
    onSuccess: async () => {
      toast.success(t("adminCategories.toastUpdated"));
      setEditOpen(false);
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ["adminCategories"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: unknown) => toast.error((e as { message?: string })?.message ?? t("adminCategories.errorUpdate")),
  });

  const toggleActive = async (c: CategoryAdminItem, next: boolean) => {
    setPatchingId(c.id);
    try {
      await api(`/api/admin/categories/${c.id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ isActive: next }),
      });
      await qc.invalidateQueries({ queryKey: ["adminCategories"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? t("adminCategories.errorToggle"));
    } finally {
      setPatchingId(null);
    }
  };

  const openCreate = () => {
    resetForm();
    setFormOrder(String(maxOrder + 1));
    setCreateOpen(true);
  };

  const openEdit = (c: CategoryAdminItem) => {
    setEditing(c);
    setFormTitle(c.title);
    setFormDescription(c.description ?? "");
    setFormSeoKeywords(formatKeywordsInput(c.seoKeywords ?? []));
    setFormOrder(String(c.order ?? 0));
    setFormActive(c.isActive);
    setEditOpen(true);
  };

  if (!auth.isAdmin) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <div className="text-lg font-extrabold">{t("adminCategories.accessTitle")}</div>
          <p className="mt-1 text-sm text-muted-foreground">{t("adminCategories.accessDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">{t("adminCategories.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("adminCategories.subtitle")}</p>
        </div>
        <Button variant="hero" className="shrink-0 gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("adminCategories.new")}
        </Button>
      </div>

      <div className="mt-8">
        {categoriesQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
            <FolderTree className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">{t("adminCategories.empty")}</p>
            <Button variant="hero" className="mt-4 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("adminCategories.new")}
            </Button>
          </div>
        ) : (
          <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <li key={c.id}>
                <Card
                  className={cn(
                    "flex h-full flex-col overflow-hidden transition-opacity",
                    !c.isActive && "border-dashed opacity-75",
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-snug">{c.title}</CardTitle>
                      <Badge variant={c.isActive ? "default" : "secondary"} className="shrink-0">
                        {c.isActive ? t("adminCategories.badgeActive") : t("adminCategories.badgeInactive")}
                      </Badge>
                    </div>
                    {c.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    ) : null}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4 pb-2 pt-0">
                    <p className="text-sm text-muted-foreground">
                      {t("adminCategories.threadCount", { count: c.threadsCount.toLocaleString("fa-IR") })}
                    </p>
                    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                      <div className="text-sm font-medium">{t("adminCategories.activeShort")}</div>
                      <Switch
                        checked={c.isActive}
                        disabled={patchingId === c.id}
                        onCheckedChange={(v) => void toggleActive(c, v)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-border/40 pt-4">
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                      {t("adminCategories.rename")}
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("adminCategories.createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("adminCategories.fieldTitle")}</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t("adminCategories.fieldTitlePh")}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("adminCategories.fieldDesc")}</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t("adminCategories.fieldDescPh")}
              />
            </div>
            <div className="grid gap-2">
              <Label>برچسب‌های SEO (با ویرگول)</Label>
              <Input
                value={formSeoKeywords}
                onChange={(e) => setFormSeoKeywords(e.target.value)}
                placeholder="کیس، مونتاژ، GPU"
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("adminCategories.fieldOrder")}</Label>
              <Input value={formOrder} onChange={(e) => setFormOrder(e.target.value)} inputMode="numeric" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
              <div>
                <div className="text-sm font-semibold">{t("adminCategories.activeInForm")}</div>
                <div className="text-xs text-muted-foreground">{t("adminCategories.activeHint")}</div>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("adminCategories.cancel")}
            </Button>
            <Button variant="hero" disabled={createMut.isPending || formTitle.trim().length < 2} onClick={() => createMut.mutate()}>
              {t("adminCategories.createBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEditing(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("adminCategories.editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("adminCategories.fieldTitle")}</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("adminCategories.fieldDesc")}</Label>
              <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>برچسب‌های SEO (با ویرگول)</Label>
              <Input value={formSeoKeywords} onChange={(e) => setFormSeoKeywords(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("adminCategories.fieldOrder")}</Label>
              <Input value={formOrder} onChange={(e) => setFormOrder(e.target.value)} inputMode="numeric" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
              <div>
                <div className="text-sm font-semibold">{t("adminCategories.activeInForm")}</div>
                <div className="text-xs text-muted-foreground">{t("adminCategories.activeHint")}</div>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t("adminCategories.close")}
            </Button>
            <Button variant="hero" disabled={updateMut.isPending || !editing} onClick={() => updateMut.mutate()}>
              {t("adminCategories.saveBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
