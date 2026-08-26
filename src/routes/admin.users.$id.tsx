import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  MessageSquare,
  MessageSquareText,
  Smile,
  Trash2,
  UserRound,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { buildSeo } from "@/lib/seo";
import { deleteAdminReaction, deleteAdminThread, fetchAdminUserDetail } from "@/api/admin";
import { deleteAdminReply } from "@/api/replies";
import { stripHtmlToText } from "@/lib/sanitize-html";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/users/$id")({
  head: () => {
    const seo = buildSeo({
      title: "پروفایل کاربر — مدیریت",
      description: "مشاهده و حذف فعالیت‌های کاربر در پنل مدیریت.",
      path: "/admin/users",
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: AdminUserDetailPage,
});

const statusConfig = {
  pending: { label: "در انتظار", className: "border-warning/30 text-warning" },
  approved: { label: "تأیید شده", className: "border-success/30 text-success" },
  rejected: { label: "رد شده", className: "border-destructive/30 text-destructive" },
};

function AdminUserDetailPage() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"threads" | "comments" | "reactions">("threads");

  const detailQuery = useQuery({
    queryKey: ["adminUserDetail", id],
    queryFn: () => fetchAdminUserDetail(id),
    enabled: auth.isAdmin && !!id,
  });

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["adminUserDetail", id] });
    await qc.invalidateQueries({ queryKey: ["adminThreads"] });
    await qc.invalidateQueries({ queryKey: ["adminUsers"] });
    await qc.invalidateQueries({ queryKey: ["adminReplies"] });
    await qc.invalidateQueries({ queryKey: ["threads"] });
  };

  const deleteThreadMut = useMutation({
    mutationFn: deleteAdminThread,
    onSuccess: async () => {
      toast.success("موضوع حذف شد");
      await invalidate();
    },
    onError: () => toast.error("حذف موضوع ناموفق بود"),
  });

  const deleteCommentMut = useMutation({
    mutationFn: deleteAdminReply,
    onSuccess: async () => {
      toast.success("کامنت حذف شد");
      await invalidate();
    },
    onError: () => toast.error("حذف کامنت ناموفق بود"),
  });

  const deleteReactionMut = useMutation({
    mutationFn: deleteAdminReaction,
    onSuccess: async () => {
      toast.success("واکنش حذف شد");
      await invalidate();
    },
    onError: () => toast.error("حذف واکنش ناموفق بود"),
  });

  const data = detailQuery.data;
  const user = data?.user;
  const counts = data?.counts;

  const initials = useMemo(
    () => (user?.name ? user.name.slice(0, 2).toUpperCase() : "U"),
    [user?.name],
  );

  if (!auth.isAdmin) {
    return (
      <div className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-4 sm:py-8 md:px-8">
        <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground shadow-card">
          دسترسی مدیریت لازم است.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4 sm:py-8 md:px-8">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" /> بازگشت به مدیریت کاربران
      </Link>

      {detailQuery.isLoading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : detailQuery.isError || !user ? (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-card p-6 text-sm text-destructive shadow-card">
          کاربر پیدا نشد یا خطا در بارگذاری.
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-card sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold">{user.name}</h1>
                <Badge
                  variant="outline"
                  className={
                    user.role === "admin" ? "border-primary/30 text-primary" : "border-border/60"
                  }
                >
                  {user.role}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    user.status === "banned"
                      ? "border-destructive/30 text-destructive"
                      : "border-success/30 text-success"
                  }
                >
                  {user.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                عضویت: {new Date(user.joinedAt).toLocaleDateString("fa-IR")}
                {user.phone ? ` · تلفن: ${user.phone}` : ""}
                {user.adminDeletedRepliesCount
                  ? ` · کامنت‌های حذف‌شده توسط ادمین: ${user.adminDeletedRepliesCount}`
                  : ""}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[16rem]">
              <StatChip icon={MessageSquare} label="موضوع" value={counts?.threads ?? 0} />
              <StatChip icon={MessageSquareText} label="کامنت" value={counts?.comments ?? 0} />
              <StatChip icon={Smile} label="واکنش" value={counts?.reactions ?? 0} />
            </div>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as typeof tab)}
            className="mt-6"
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="threads" className="flex-1 sm:flex-none">
                موضوعات ({counts?.threads ?? 0})
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex-1 sm:flex-none">
                کامنت‌ها ({counts?.comments ?? 0})
              </TabsTrigger>
              <TabsTrigger value="reactions" className="flex-1 sm:flex-none">
                واکنش‌ها ({counts?.reactions ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="threads" className="mt-4">
              <ActivityTable empty="موضوعی ثبت نشده">
                {(data?.threads ?? []).map((t) => {
                  const cfg = statusConfig[t.status];
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="max-w-md font-medium">{t.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {t.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.className}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(t.createdAt).toLocaleString("fa-IR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {t.status === "approved" ? (
                            <Button variant="outline" size="sm" asChild>
                              <Link to="/threads/$id" params={{ id: t.id }}>
                                مشاهده
                              </Link>
                            </Button>
                          ) : null}
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteThreadMut.isPending}
                            onClick={() => {
                              const ok = window.confirm("این موضوع و کامنت‌هایش حذف شود؟");
                              if (!ok) return;
                              deleteThreadMut.mutate(t.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </ActivityTable>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <ActivityTable empty="کامنتی ثبت نشده" heads={["موضوع", "متن", "تاریخ", "عملیات"]}>
                {(data?.comments ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="max-w-xs">
                      {c.thread.id ? (
                        <Link
                          to="/threads/$id"
                          params={{ id: c.thread.id }}
                          className="line-clamp-2 font-medium hover:text-primary hover:underline"
                        >
                          {c.thread.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{c.thread.title}</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="line-clamp-2 text-sm">{stripHtmlToText(c.content)}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString("fa-IR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteCommentMut.isPending}
                          onClick={() => {
                            const ok = window.confirm("این کامنت حذف شود؟");
                            if (!ok) return;
                            deleteCommentMut.mutate(c.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </ActivityTable>
            </TabsContent>

            <TabsContent value="reactions" className="mt-4">
              <ActivityTable empty="واکنشی ثبت نشده" heads={["ایموجی", "موضوع", "تاریخ", "عملیات"]}>
                {(data?.reactions ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-2xl">{r.emoji}</TableCell>
                    <TableCell className="max-w-md">
                      {r.thread.id ? (
                        <Link
                          to="/threads/$id"
                          params={{ id: r.thread.id }}
                          className="line-clamp-2 font-medium hover:text-primary hover:underline"
                        >
                          {r.thread.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{r.thread.title}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("fa-IR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteReactionMut.isPending}
                          onClick={() => {
                            const ok = window.confirm("این واکنش حذف شود؟");
                            if (!ok) return;
                            deleteReactionMut.mutate(r.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </ActivityTable>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-1 text-lg font-extrabold">{value.toLocaleString("fa-IR")}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ActivityTable({
  children,
  empty,
  heads = ["عنوان", "دسته", "وضعیت", "تاریخ", "عملیات"],
}: {
  children: React.ReactNode;
  empty: string;
  heads?: string[];
}) {
  const rows = Array.isArray(children) ? children : [children];
  const hasRows = rows.filter(Boolean).length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {heads.map((h, i) => (
              <TableHead key={h} className={i === heads.length - 1 ? "text-end" : "text-start"}>
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
      {!hasRows ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{empty}</div>
      ) : null}
    </div>
  );
}
