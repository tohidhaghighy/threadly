import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { cardHeaderGradientClasses, cardShellClasses } from "@/styles/shared/page";

type PageSectionProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageSection({ title, description, icon, headerExtra, children, className }: PageSectionProps) {
  return (
    <section className={cn(cardShellClasses, className)}>
      <div className={cardHeaderGradientClasses}>
        <div className="flex flex-wrap items-center gap-4">
          {icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {headerExtra}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
