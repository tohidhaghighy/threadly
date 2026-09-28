import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, MessageSquareText, Pencil, Trash2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/shared/rich-text";
import { stripHtmlToText } from "@/lib/sanitize-html";
import { toast } from "sonner";
import { useAdminReplies, useDeleteAdminReply, useUpdateAdminReply } from "@/hooks/api";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildSeo } from "@/lib/seo";
import { AdminPager, useClientPage } from "@/components/admin/AdminPager";

export const Route = createFileRoute("/admin/comments")({
  head: () => {
    const seo = buildSeo({
      title: "مدیریت کامنت‌ها",
      description: "ویرایش و حذف پاسخ‌ها (کامنت‌ها) در موضوعات.",
      path: "/admin/comments",
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: AdminCommentsPage,
});

function AdminCommentsPage() {
  const auth = useAuth();

  const [threadQ, setThreadQ] = useState("");
  const [q, setQ] = useState("");
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const filterUsersQuery = useQuery({
    queryKey: ["adminUsers", "filterOptions"],
    queryFn: () => api<{ items: Array<{ id: string; name: string }> }>("/api/admin/users", { auth: true }),
    enabled: auth.isAdmin,
  });
  const filterUsers = filterUsersQuery.data?.items ?? [];

  const repliesQuery = useAdminReplies(threadQ, q, auth.isAdmin, authorId ?? "");
  const updateMut = useUpdateAdminReply();
  const deleteMut = useDeleteAdminReply();

  const items = useMemo(() => repliesQuery.data?.items ?? [], [repliesQuery.data?.items]);
  const page = useClientPage(items, `${threadQ}|${q}|${authorId ?? ""}`);

  if (!auth.isAdmin) {
    return (
      <div className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-4 sm:py-8 md:px-8">
        <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground shadow-card">
          دسترسی مدیریت لازم است. با `admin@threadly.com` (رمز: `threadly`) وارد شوید.
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="admin-rtl mx-auto w-full max-w-6xl px-3 py-5 sm:px-4 sm:py-8 md:px-8">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" /> بازگشت به پنل مدیریت
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <MessageSquareText className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">مدیریت کامنت‌ها</h1>
          <p className="text-sm text-muted-foreground">جستجو، ویرایش و حذف پاسخ‌ها در موضوعات</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Select
          value={authorId ?? "__all__"}
          onValueChange={(v) => setAuthorId(v === "__all__" ? null : v)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="فیلتر کاربر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">همه کاربران</SelectItem>
            {filterUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={threadQ}
            onChange={(e) => setThreadQ(e.target.value)}
            placeholder="جستجو با عنوان موضوع…"
            className="pe-10"
          />
        </div>
        <div className="relative">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو داخل متن کامنت…"
            className="pe-10"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <Table mobileStack dir="rtl">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-start">موضوع</TableHead>
              <TableHead className="text-start">نویسنده</TableHead>
              <TableHead className="text-start">متن</TableHead>
              <TableHead className="text-start">تاریخ</TableHead>
              <TableHead className="text-end">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.items.map((r) => (
              <TableRow key={r.id} className="hover:bg-muted/30">
                <TableCell data-label="موضوع" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="line-clamp-1 font-medium">{r.thread.title}</div>
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      {r.thread.id.slice(0, 8)}…
                    </Badge>
                  </div>
                </TableCell>
                <TableCell data-label="نویسنده" className="text-sm text-muted-foreground">{r.author.displayName}</TableCell>
                <TableCell data-label="متن" className="max-w-md">
                  <div className="line-clamp-2 text-sm">{stripHtmlToText(r.content)}</div>
                </TableCell>
                <TableCell data-label="تاریخ" className="text-sm text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString("fa-IR")}
                </TableCell>
                <TableCell data-label="عملیات">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditId(r.id);
                        setEditContent(r.content);
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" /> ویرایش
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteMut.isPending}
                      onClick={() => {
                        const ok = window.confirm("کامنت حذف شود؟ این کار قابل بازگشت نیست.");
                        if (!ok) return;
                        deleteMut.mutate(r.id, {
                          onSuccess: () => toast.success("کامنت حذف شد"),
                          onError: () => toast.error("حذف کامنت ناموفق بود"),
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> حذف
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {repliesQuery.isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">در حال بارگذاری…</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">کامنتی پیدا نشد</div>
        ) : null}
        <AdminPager
          page={page.page}
          pageCount={page.pageCount}
          total={page.total}
          onPageChange={page.setPage}
        />
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditId(null);
            setEditContent("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>ویرایش کامنت</DialogTitle>
          </DialogHeader>
          <RichTextEditor
            value={editContent}
            onChange={setEditContent}
            minHeightClassName="min-h-48"
            placeholder="متن کامنت را ویرایش کنید…"
            variant="user"
          />
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
              بستن
            </Button>
            <Button
              variant="hero"
              type="button"
              disabled={updateMut.isPending || !editId || !stripHtmlToText(editContent)}
              onClick={() => {
                if (!editId) return;
                updateMut.mutate(
                  { id: editId, content: editContent },
                  {
                    onSuccess: () => {
                      toast.success("کامنت ذخیره شد");
                      setEditOpen(false);
                      setEditId(null);
                    },
                    onError: () => toast.error("ذخیره کامنت ناموفق بود"),
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

