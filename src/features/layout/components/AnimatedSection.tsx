import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

export function AnimatedSection({
  className,
  delayMs = 0,
  children,
}: {
  className?: string;
  delayMs?: number;
  children: ReactNode;
}) {
  return (
    <section
      className={cn("animate-in fade-in slide-in-from-bottom-2 duration-500", className)}
      style={delayMs ? ({ animationDelay: `${delayMs}ms` } as CSSProperties) : undefined}
    >
      {children}
    </section>
  );
}

