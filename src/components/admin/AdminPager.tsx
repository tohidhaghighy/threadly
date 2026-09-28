import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ADMIN_PAGE_SIZE = 10;

export function useClientPage<T>(items: readonly T[], resetKey: string = "") {
  const [state, setState] = useState({ key: resetKey, page: 1 });
  if (state.key !== resetKey) {
    setState({ key: resetKey, page: 1 });
  }

  const pageCount = Math.max(1, Math.ceil(items.length / ADMIN_PAGE_SIZE));
  const storedPage = state.key === resetKey ? state.page : 1;
  const page = Math.min(storedPage, pageCount);
  const start = (page - 1) * ADMIN_PAGE_SIZE;

  return {
    page,
    pageCount,
    total: items.length,
    items: items.slice(start, start + ADMIN_PAGE_SIZE),
    setPage: (next: number) => setState({ key: resetKey, page: next }),
  };
}

export function AdminPager({
  page,
  pageCount,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (total === 0) return null;

  const from = (page - 1) * ADMIN_PAGE_SIZE + 1;
  const to = Math.min(page * ADMIN_PAGE_SIZE, total);
  const fa = (n: number) => n.toLocaleString("fa-IR");

  return (
    <nav
      dir="rtl"
      aria-label="صفحه‌بندی"
      className={cn(
        "flex flex-col items-center gap-3 border-t border-border/60 px-3 py-3 sm:flex-row sm:justify-between",
        className,
      )}
    >
      <p className="text-center text-xs text-muted-foreground sm:text-start">
        {fa(from)}–{fa(to)} از {fa(total)}
      </p>
      <div className="flex w-full items-center justify-center gap-2 sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-w-[5.5rem]"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronRight className="h-4 w-4" />
          قبلی
        </Button>
        <span className="min-w-[4.5rem] text-center text-sm font-semibold tabular-nums">
          {fa(page)} / {fa(pageCount)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-w-[5.5rem]"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          بعدی
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
