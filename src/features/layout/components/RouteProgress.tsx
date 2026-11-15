import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

const MAX_VISIBLE_MS = 8_000;

/**
 * Thin top loading bar during client navigations.
 * Completes when the router is idle, or after a hard timeout so a hung load
 * never leaves the UI stuck in "loading".
 */
export function RouteProgress() {
  const isNavigating = useRouterState({
    select: (s) => s.status === "pending" || Boolean(s.isLoading),
  });

  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(false);
  const startedRef = useRef(false);
  const trickleRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);
  const safetyRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTrickle = () => {
      if (trickleRef.current) {
        window.clearInterval(trickleRef.current);
        trickleRef.current = null;
      }
    };
    const clearSafety = () => {
      if (safetyRef.current) {
        window.clearTimeout(safetyRef.current);
        safetyRef.current = null;
      }
    };
    const clearHide = () => {
      if (hideRef.current) {
        window.clearTimeout(hideRef.current);
        hideRef.current = null;
      }
    };

    const finish = () => {
      if (!startedRef.current) return;
      clearTrickle();
      clearSafety();
      startedRef.current = false;
      setWidth(100);
      clearHide();
      hideRef.current = window.setTimeout(() => {
        setActive(false);
        setWidth(0);
      }, 280);
    };

    if (isNavigating) {
      clearHide();
      clearTrickle();
      clearSafety();
      startedRef.current = true;
      setActive(true);
      setWidth(12);
      trickleRef.current = window.setInterval(() => {
        setWidth((w) => {
          if (w >= 90) return w;
          const inc = w < 40 ? 12 : w < 65 ? 6 : w < 80 ? 2 : 1;
          return Math.min(90, w + inc);
        });
      }, 200);
      safetyRef.current = window.setTimeout(finish, MAX_VISIBLE_MS);
    } else {
      finish();
    }

    return () => {
      clearTrickle();
      clearSafety();
      clearHide();
    };
  }, [isNavigating]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
      style={{ opacity: active ? 1 : 0, transition: "opacity 250ms ease" }}
    >
      <div
        className="relative h-full rounded-e-full bg-gradient-to-r from-primary via-primary-glow to-primary"
        style={{
          width: `${width}%`,
          transition: "width 200ms ease-out",
          boxShadow:
            "0 0 10px var(--primary), 0 0 6px var(--primary-glow), 0 1px 3px rgba(0,0,0,0.25)",
        }}
      >
        <div className="absolute inset-y-0 end-0 w-24 -translate-y-[1px] rotate-3 bg-primary-glow/70 blur-[6px]" />
      </div>
    </div>
  );
}

export default RouteProgress;
