import { createFileRoute } from "@tanstack/react-router";
import { Check, X, Eye, ShieldCheck, Clock, AlertCircle, Search, Users } from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/lib/categories";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "مدیریت — Threadly" },
      { name: "description", content: "بررسی و مدیریت موضوعات و کاربران در Threadly." },
    ],
  }),
  component: AdminPanel,
});

const statusConfig = {
  pending: { label: "در انتظار", icon: Clock, className: "bg-warning/15 text-warning border-warning/30" },
  approved: { label: "تأیید شده", icon: Check, className: "bg-success/15 text-success border-success/30" },
  rejected: { label: "رد شده", icon: X, className: "bg-destructive/15 text-destructive border-destructive/30" },
};

function AdminPanel() {
  const [tab, setTab] = useState<"threads" | "users">("threads");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [userQuery, setUserQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const auth = useAuth();
  const qc = useQueryClient();
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data?.items ?? [];

  const threadsQuery = useQuery({
    queryKey: ["adminThreads", filter, category],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (filter !== "all") qs.set("status", filter);
      if (category) qs.set("category", category);
      return api<{ items: any[]; nextCursor: string | null }>(`/api/admin/threads?${qs.toString()}`, { auth: true });
    },
    enabled: auth.isAdmin,
  });

  const usersQuery = useQuery({
    queryKey: ["adminUsers", userQuery],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (userQuery.trim()) qs.set("q", userQuery.trim());
      return api<{ items: any[]; nextCursor: string | null }>(`/api/admin/users?${qs.toString()}`, { auth: true });
    },
    enabled: auth.isAdmin,
  });

  const items = useMemo(
    () =>
      (threadsQuery.data?.items ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        author: t.author?.displayName ?? "نامشخص",
        category: t.category,
        date: new Date(t.createdAt).toLocaleDateString(),
        status: t.status as "pending" | "approved" | "rejected",
      })),
    [threadsQuery.data?.items],
  );

  const filtered = items;
  const counts = {
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  };

  const approveMut = useMutation({
    mutationFn: (id: string) => api(`/api/admin/threads/${id}/approve`, { method: "POST", auth: true }),
    onSuccess: async () => {
      toast.success("موضوع تأیید شد");
      await qc.invalidateQueries({ queryKey: ["adminThreads"] });
      await qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });
  const rejectMut = useMutation({
    mutationFn: (id: string) => api(`/api/admin/threads/${id}/reject`, { method: "POST", auth: true }),
    onSuccess: async () => {
      toast.success("موضوع رد شد");
      await qc.invalidateQueries({ queryKey: ["adminThreads"] });
      await qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const users = useMemo(() => usersQuery.data?.items ?? [], [usersQuery.data?.items]);
  const setRoleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "user" | "admin" }) =>
      api(`/api/admin/users/${id}/role`, { method: "POST", auth: true, body: JSON.stringify({ role }) }),
    onSuccess: async (_data, vars) => {
      toast.success(vars.role === "admin" ? "به مدیر ارتقا یافت" : "به کاربر تغییر کرد");
      await qc.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
  const setStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "banned" }) =>
      api(`/api/admin/users/${id}/ban`, { method: "POST", auth: true, body: JSON.stringify({ status }) }),
    onSuccess: async (_data, vars) => {
      toast.success(vars.status === "banned" ? "کاربر بن شد" : "بن کاربر برداشته شد");
      await qc.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      {!auth.isAdmin ? (
        <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground shadow-card">
          دسترسی مدیریت لازم است. با `admin@threadly.com` (رمز: `threadly`) وارد شوید.
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <ShieldCheck className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold">پنل مدیریت</h1>
          <p className="text-sm text-muted-foreground">بررسی و تأیید موضوعات ارسال‌شده</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "threads" | "users")} className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="threads">موضوعات</TabsTrigger>
            <TabsTrigger value="users">کاربران</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="threads">
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="در انتظار بررسی" value={counts.pending} icon={Clock} accent="warning" />
            <StatCard label="تأیید شده" value={counts.approved} icon={Check} accent="success" />
            <StatCard label="رد شده" value={counts.rejected} icon={AlertCircle} accent="destructive" />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                <Button key={f} variant={filter === f ? "hero" : "outline"} size="sm" onClick={() => setFilter(f)}>
                  {f === "all" ? "همه" : statusConfig[f].label}
                </Button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <Select
                value={category ?? "__all__"}
                onValueChange={(v) => setCategory(v === "__all__" ? null : v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">همه دسته‌ها</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.title}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative ms-auto w-full max-w-xs">
              <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="جستجوی موضوع..." className="pe-10" />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-start">عنوان</TableHead>
                  <TableHead className="text-start">نویسنده</TableHead>
                  <TableHead className="text-start">دسته‌بندی</TableHead>
                  <TableHead className="text-start">تاریخ</TableHead>
                  <TableHead className="text-start">وضعیت</TableHead>
                  <TableHead className="text-end">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const cfg = statusConfig[item.status];
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="max-w-md font-medium">{item.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.author}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/30 text-primary">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.className}>
                          <cfg.icon className="me-1 h-3 w-3" />{cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                          {item.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-success hover:bg-success/15"
                                onClick={() => approveMut.mutate(item.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/15"
                                onClick={() => rejectMut.mutate(item.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-sm text-muted-foreground">نتیجه‌ای یافت نشد</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">مدیریت کاربران</p>
                <p className="text-xs text-muted-foreground">ارتقای مدیر، بن/رفع بن کاربران</p>
              </div>
            </div>

            <div className="relative ms-auto w-full max-w-xs">
              <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجوی کاربران..."
                className="pe-10"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-start">نام</TableHead>
                  <TableHead className="text-start">ایمیل</TableHead>
                  <TableHead className="text-start">نقش</TableHead>
                  <TableHead className="text-start">وضعیت</TableHead>
                  <TableHead className="text-start">تاریخ عضویت</TableHead>
                  <TableHead className="text-end">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={u.role === "admin" ? "border-primary/30 text-primary" : "border-border/60 text-muted-foreground"}
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={u.status === "banned" ? "border-destructive/30 text-destructive" : "border-success/30 text-success"}
                      >
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.joinedAt}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const nextRole = u.role === "admin" ? "user" : "admin";
                            setRoleMut.mutate({ id: u.id, role: nextRole });
                          }}
                        >
                          {u.role === "admin" ? "تبدیل به کاربر" : "تبدیل به مدیر"}
                        </Button>
                        <Button
                          variant={u.status === "banned" ? "outline" : "destructive"}
                          size="sm"
                          onClick={() => {
                            const next = u.status === "banned" ? "active" : "banned";
                            setStatusMut.mutate({ id: u.id, status: next });
                          }}
                        >
                          {u.status === "banned" ? "رفع بن" : "بن"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {users.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">کاربری یافت نشد</div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: ComponentType<{ className?: string }>; accent: "warning" | "success" | "destructive" }) {
  const colors = {
    warning: "bg-warning/15 text-warning",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
  };
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-card">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors[accent]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-extrabold">{value.toLocaleString("fa-IR")}</p>
      </div>
    </div>
  );
}
