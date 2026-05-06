import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

type CategoryAdminItem = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isActive: boolean;
  threadsCount: number;
  createdAt: string;
  updatedAt: string;
};

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [
      { title: "مدیریت دسته‌بندی‌ها — Threadly" },
      { name: "description", content: "مدیریت دسته‌بندی‌ها در Threadly." },
    ],
  }),
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const auth = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryAdminItem | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formOrder, setFormOrder] = useState("0");
  const [formActive, setFormActive] = useState(true);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormOrder("0");
    setFormActive(true);
  };

  const categoriesQuery = useQuery({
    queryKey: ["adminCategories", q],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set("q", q.trim());
      return api<{ items: CategoryAdminItem[] }>(`/api/admin/categories?${qs.toString()}`, { auth: true });
    },
    enabled: auth.isAdmin,
  });

  const items = useMemo(() => categoriesQuery.data?.items ?? [], [categoriesQuery.data?.items]);

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
          order: Number.isFinite(order) ? order : 0,
          isActive: formActive,
        }),
      });
    },
    onSuccess: async () => {
      toast.success("دسته‌بندی ایجاد شد");
      setCreateOpen(false);
      resetForm();
      await qc.invalidateQueries({ queryKey: ["adminCategories"] });
      await qc.invalidateQueries({ queryKey: ["categories", "counts"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "خطا در ایجاد دسته‌بندی"),
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
          order: Number.isFinite(order) ? order : 0,
          isActive: formActive,
        }),
      });
    },
    onSuccess: async () => {
      toast.success("دسته‌بندی به‌روزرسانی شد");
      setEditOpen(false);
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ["adminCategories"] });
      await qc.invalidateQueries({ queryKey: ["categories", "counts"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "خطا در به‌روزرسانی دسته‌بندی"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/api/admin/categories/${id}`, { method: "DELETE", auth: true }),
    onSuccess: async () => {
      toast.success("دسته‌بندی حذف شد");
      await qc.invalidateQueries({ queryKey: ["adminCategories"] });
      await qc.invalidateQueries({ queryKey: ["categories", "counts"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "خطا در حذف دسته‌بندی"),
  });

  if (!auth.isAdmin) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <div className="text-lg font-extrabold">دسترسی مدیر لازم است</div>
          <p className="mt-1 text-sm text-muted-foreground">برای مدیریت دسته‌بندی‌ها باید با حساب مدیر وارد شوید.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">مدیریت دسته‌بندی‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">افزودن، ویرایش، فعال/غیرفعال و حذف دسته‌بندی‌ها</p>
        </div>
        <div className="flex w-full gap-2 md:w-auto">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو..." className="h-10 md:w-64" />
          <Button
            variant="hero"
            onClick={() => {
              resetForm();
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            افزودن
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-start">عنوان</TableHead>
              <TableHead className="text-start">توضیح</TableHead>
              <TableHead className="text-start">ترتیب</TableHead>
              <TableHead className="text-start">فعال</TableHead>
              <TableHead className="text-start">تعداد گفتگو</TableHead>
              <TableHead className="text-end">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoriesQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  در حال بارگذاری...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  دسته‌بندی‌ای پیدا نشد.
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.description ?? "—"}</TableCell>
                  <TableCell className="text-sm">{c.order.toLocaleString("fa-IR")}</TableCell>
                  <TableCell>
                    <Switch
                      checked={c.isActive}
                      onCheckedChange={(v) => {
                        void api(`/api/admin/categories/${c.id}`, {
                          method: "PATCH",
                          auth: true,
                          body: JSON.stringify({ isActive: v }),
                        })
                          .then(async () => {
                            await qc.invalidateQueries({ queryKey: ["adminCategories"] });
                            await qc.invalidateQueries({ queryKey: ["categories", "counts"] });
                          })
                          .catch((e: any) => toast.error(e?.message ?? "خطا"));
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.threadsCount.toLocaleString("fa-IR")}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="inline-flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(c);
                          setFormTitle(c.title);
                          setFormDescription(c.description ?? "");
                          setFormOrder(String(c.order ?? 0));
                          setFormActive(c.isActive);
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        ویرایش
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteMut.isPending}
                        onClick={() => deleteMut.mutate(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>افزودن دسته‌بندی</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>عنوان</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="مثلاً: کارت گرافیک" />
            </div>
            <div className="grid gap-2">
              <Label>توضیح</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="مثلاً: بحث درباره GPU و درایورها"
              />
            </div>
            <div className="grid gap-2">
              <Label>ترتیب</Label>
              <Input value={formOrder} onChange={(e) => setFormOrder(e.target.value)} inputMode="numeric" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
              <div>
                <div className="text-sm font-semibold">فعال باشد</div>
                <div className="text-xs text-muted-foreground">در لیست عمومی نمایش داده شود</div>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              انصراف
            </Button>
            <Button variant="hero" disabled={createMut.isPending || formTitle.trim().length < 2} onClick={() => createMut.mutate()}>
              ایجاد
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
            <DialogTitle>ویرایش دسته‌بندی</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>عنوان</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>توضیح</Label>
              <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>ترتیب</Label>
              <Input value={formOrder} onChange={(e) => setFormOrder(e.target.value)} inputMode="numeric" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
              <div>
                <div className="text-sm font-semibold">فعال باشد</div>
                <div className="text-xs text-muted-foreground">در لیست عمومی نمایش داده شود</div>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              بستن
            </Button>
            <Button variant="hero" disabled={updateMut.isPending || !editing} onClick={() => updateMut.mutate()}>
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

