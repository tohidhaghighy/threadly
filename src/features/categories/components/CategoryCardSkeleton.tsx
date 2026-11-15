import { Skeleton } from "@/components/ui/skeleton";
import type { HTMLAttributes } from "react";

export function CategoryCardSkeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className ?? "rounded-2xl border border-border/60 bg-card p-6 shadow-card"} {...props}>
      <div className="space-y-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-11/12" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </div>
    </div>
  );
}

