import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bold, Italic, List, Link as LinkIcon, Image as ImageIcon, Code2, Upload, Eye, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { categories } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/new")({
  head: () => ({ meta: [{ title: "ایجاد موضوع — پارس‌بیلد" }] }),
  component: NewTopic,
});

function NewTopic() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-warning/15">
          <Clock className="h-10 w-10 text-warning" />
        </div>
        <Badge className="mt-4 bg-warning/20 text-warning border border-warning/30">در انتظار تأیید</Badge>
        <h1 className="mt-4 text-3xl font-extrabold">موضوع شما ارسال شد</h1>
        <p className="mt-2 text-muted-foreground">
          پس از بررسی توسط مدیران، در انجمن منتشر خواهد شد. این فرآیند معمولاً کمتر از ۲۴ ساعت طول می‌کشد.
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
          <h1 className="text-3xl font-extrabold">ایجاد موضوع جدید</h1>
          <p className="mt-1 text-sm text-muted-foreground">سؤال یا تجربه خود را با جامعه به اشتراک بگذارید</p>
        </div>
        <Badge variant="outline" className="border-warning/40 text-warning">
          <CheckCircle2 className="me-1 h-3 w-3" /> نیازمند تأیید مدیر
        </Badge>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setSubmitted(true); toast.success("موضوع برای بررسی ارسال شد"); }}
        className="mt-8 space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card md:p-8"
      >
        <div className="grid gap-2">
          <Label htmlFor="title" className="text-sm font-semibold">عنوان موضوع</Label>
          <Input id="title" required placeholder="مثلاً: مشکل بوت سیستم پس از نصب RTX 4080" className="h-12 text-base" />
          <p className="text-xs text-muted-foreground">عنوانی واضح و توصیفی انتخاب کنید (حداقل ۱۰ کاراکتر)</p>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-semibold">دسته‌بندی</Label>
          <Select required>
            <SelectTrigger className="h-12"><SelectValue placeholder="یک دسته انتخاب کنید" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2"><c.icon className="h-4 w-4" />{c.title}</div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-semibold">برچسب‌ها</Label>
          <Input placeholder="با کاما جدا کنید: GPU, Cooling, FPS" />
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-semibold">محتوا</Label>
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Bold className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Italic className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><List className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><LinkIcon className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Code2 className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><ImageIcon className="h-4 w-4" /></Button>
              <div className="ms-auto">
                <Button type="button" variant="ghost" size="sm"><Eye className="h-4 w-4" /> پیش‌نمایش</Button>
              </div>
            </div>
            <Textarea
              required
              placeholder="جزئیات کامل را بنویسید. مشخصات سیستم، ارورها، چیزی که امتحان کرده‌اید..."
              className="min-h-64 resize-none border-0 bg-transparent text-base focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-semibold">تصاویر و فایل‌ها</Label>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-8 text-center transition hover:border-primary/50 hover:bg-primary/5">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">برای آپلود کلیک کنید یا فایل را بکشید</p>
            <p className="mt-1 text-xs text-muted-foreground">PNG، JPG، GIF — حداکثر ۱۰ مگابایت</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-6">
          <Button type="button" variant="ghost">انصراف</Button>
          <Button type="button" variant="outline">ذخیره پیش‌نویس</Button>
          <Button type="submit" variant="hero">ارسال برای بررسی</Button>
        </div>
      </form>
    </div>
  );
}
