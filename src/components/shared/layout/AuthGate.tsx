import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { pageContainerClasses } from "@/styles/shared/page";

type AuthGateProps = {
  isAuthenticated: boolean;
  /** When auth state is still restoring from storage */
  ready?: boolean;
  message?: string;
  loginLabel?: string;
  children: ReactNode;
};

export function AuthGate({
  isAuthenticated,
  ready = true,
  message = "برای ادامه وارد شوید.",
  loginLabel = "ورود",
  children,
}: AuthGateProps) {
  if (!ready) {
    return (
      <div className={pageContainerClasses}>
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-card">
          <p className="text-sm text-muted-foreground">در حال بررسی ورود...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className={pageContainerClasses}>
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-card">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button asChild className="mt-4" variant="hero">
          <Link to="/login">{loginLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
