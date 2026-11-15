import { Skeleton } from "@/components/ui/skeleton";
import type { HTMLAttributes } from "react";

export function ThreadCardSkeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className ?? "rounded-xl border border-border/60 bg-card p-5"} {...props}>
      <div className="flex gap-4">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

