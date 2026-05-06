import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Eye, ShieldCheck, Clock, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { adminQueue } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "پنل مدیریت — پارس‌بیلد" }] }),
  component: AdminPanel,
});

const statusConfig = {
  pending: { label: "در انتظار", icon: Clock, className: "bg-warning/15 text-warning border-warning/30" },
  approved: { label: "تأیید شده", icon: Check, className: "bg-success/15 text-success border-success/30" },
  rejected: { label: "رد شده", icon: X, className: "bg-destructive/15 text-destructive border-destructive/30" },
};

function AdminPanel() {
  const [items, setItems] = useState(adminQueue);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filtered = items.filter((i) => filter === "all" || i.status === filter);
  const counts = {
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  };

  const update = (id: string, status: "approved" | "rejected") => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    toast.success(status === "approved" ? "موضوع تأیید شد" : "موضوع رد شد");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <ShieldCheck className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold">پنل مدیریت</h1>
          <p className="text-sm text-muted-foreground">بررسی و تأیید موضوعات ارسالی</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              <TableHead className="text-start">دسته</TableHead>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-success/15" onClick={() => update(item.id, "approved")}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/15" onClick={() => update(item.id, "rejected")}>
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
          <div className="py-16 text-center text-sm text-muted-foreground">موردی یافت نشد</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent: "warning" | "success" | "destructive" }) {
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
