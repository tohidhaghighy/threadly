import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { api } from "@/lib/api";

type LatestItem = { id: string; title: string; approvedAt: string };

type Notice = LatestItem & { key: string };

const POLL_MS = 4000;

async function fetchLatestApproved(): Promise<LatestItem | null> {
  try {
    const res = await api<{ item: LatestItem | null }>("/api/threads/latest");
    return res.item;
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status !== 404) throw err;
    const list = await api<{ items: { id: string; title: string; createdAt: string }[] }>(
      "/api/threads?sort=new&limit=1",
    );
    const first = list.items[0];
    if (!first) return null;
    return { id: first.id, title: first.title, approvedAt: first.createdAt };
  }
}

/**
 * Polls for a newly approved thread and shows a centered top toast.
 * The first result only sets a baseline so existing posts are not announced.
 */
export function NewThreadNotice() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const baseline = useRef<string | null | undefined>(undefined);
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const item = await fetchLatestApproved();
        if (cancelled) return;
        if (baseline.current === undefined) {
          baseline.current = item?.approvedAt ?? null;
          return;
        }
        if (!item || item.approvedAt === baseline.current) return;
        const previous = baseline.current;
        baseline.current = item.approvedAt;
        if (previous && item.approvedAt < previous) return;

        setNotices((current) => {
          if (current.some((n) => n.id === item.id)) return current;
          return [...current, { ...item, key: `${item.id}-${item.approvedAt}` }].slice(-3);
        });
        void qc.invalidateQueries({ queryKey: ["home"] });
        void qc.invalidateQueries({ queryKey: ["threads"] });
        void qc.invalidateQueries({ queryKey: ["stats"] });
      } catch {
        // network blips should not surface a toast
      }
    };

    void tick();
    const timer = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [qc]);

  if (!notices.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex flex-col items-center gap-2 px-3">
      {notices.map((notice) => (
        <div
          key={notice.key}
          className="pointer-events-auto animate-rise flex w-full max-w-md items-stretch overflow-hidden rounded-2xl border border-primary/40 bg-card/95 shadow-glow backdrop-blur-xl"
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-start transition hover:bg-primary/10"
            onClick={() => {
              setNotices((current) => current.filter((n) => n.key !== notice.key));
              void navigate({ to: "/threads/$id", params: { id: notice.id } });
            }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold">1 پست جدید ثبت شده است</span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">{notice.title}</span>
            </span>
          </button>
          <button
            type="button"
            aria-label="بستن"
            className="flex w-11 shrink-0 items-center justify-center border-s border-border/60 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            onClick={() => setNotices((current) => current.filter((n) => n.key !== notice.key))}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
