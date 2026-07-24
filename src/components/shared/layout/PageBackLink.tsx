import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PageBackLinkProps = {
  to: string;
  label?: string;
  className?: string;
};

export function PageBackLink({ to, label = "بازگشت", className }: PageBackLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <ArrowRight className="h-4 w-4" /> {label}
    </Link>
  );
}
