import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, Sparkles, ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categories, threads } from "@/lib/mock-data";
import { ThreadCard } from "@/components/ThreadCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "پارس‌بیلد — انجمن سازندگان کیس" },
      { name: "description", content: "گفتگو، راهنما و عیب‌یابی برای گیمرها و سازندگان PC در ایران." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-card md:p-12">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="absolute -end-20 -top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative">
          <Badge className="bg-primary/20 text-primary border border-primary/30">
            <Sparkles className="me-1 h-3 w-3" /> انجمن رسمی پارس‌بیلد
          </Badge>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            هر آنچه برای ساختن <span className="text-gradient-primary">PC رویایی</span> نیاز دارید
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            از مونتاژ کیس و نصب بازی تا عیب‌یابی پیشرفته. به جامعه‌ای از گیمرها و بیلدرهای حرفه‌ای ایرانی بپیوندید.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg"><Link to="/new">شروع گفتگو</Link></Button>
            <Button asChild variant="glow" size="lg"><Link to="/threads">مرور موضوعات</Link></Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <div><span className="text-2xl font-extrabold text-gradient-primary">۵٬۶۳۴</span><span className="ms-2 text-muted-foreground">گفتگو</span></div>
            <div><span className="text-2xl font-extrabold text-gradient-primary">۲۸٬۹۱۲</span><span className="ms-2 text-muted-foreground">عضو</span></div>
            <div><span className="text-2xl font-extrabold text-gradient-primary">۹۸٪</span><span className="ms-2 text-muted-foreground">پاسخ‌گویی</span></div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">دسته‌بندی‌ها</h2>
            <p className="mt-1 text-sm text-muted-foreground">موضوع مورد علاقه‌ات را انتخاب کن</p>
          </div>
          <Link to="/threads" className="text-sm font-medium text-primary hover:underline">
            همه <ArrowLeft className="inline h-3 w-3" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to="/threads"
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-50 transition-opacity group-hover:opacity-100`} />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <cat.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{cat.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {cat.threads.toLocaleString("fa-IR")} گفتگو
                  </span>
                  <ArrowLeft className="h-4 w-4 text-primary transition-transform group-hover:-translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">گفتگوهای داغ</h2>
              <p className="text-sm text-muted-foreground">پربازدیدترین‌های این هفته</p>
            </div>
          </div>
          <Button variant="outline" size="sm"><Filter className="h-4 w-4" />فیلتر</Button>
        </div>

        <div className="mt-6 space-y-4">
          {threads.slice(0, 4).map((t) => (
            <ThreadCard key={t.id} thread={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
