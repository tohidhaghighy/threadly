import { Link, useRouterState } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useUserProfile } from "@/hooks/api";
import { levelFromPoints } from "@/lib/gamification";
import { PHONE_REQUIRED_MIN_LEVEL } from "@/lib/points";
import { Button } from "@/components/ui/button";

export function needsPhoneForSupport(points: number, phone: string | null | undefined): boolean {
  if (phone?.trim()) return false;
  return levelFromPoints(points).level >= PHONE_REQUIRED_MIN_LEVEL;
}

/** Banner for users at level 4+ who have not set a mobile number yet. */
export function PhoneRequiredBanner() {
  const auth = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profileQuery = useUserProfile(auth.user?.id ?? "", { enabled: !!auth.user });

  if (!auth.user) return null;
  if (pathname.startsWith("/settings")) return null;

  const points = profileQuery.data?.points ?? 0;
  if (!needsPhoneForSupport(points, auth.user.phone)) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600">
            <Phone className="h-4 w-4" />
          </div>
          <div>
            <p className="font-extrabold text-foreground">ثبت شماره موبایل الزامی است</p>
            <p className="mt-0.5 text-muted-foreground">
              از سطح ۴ به بعد، ثبت موبایل اجباری است تا پشتیبانی بتواند برای جوایز یا تماس با شما ارتباط بگیرد.
            </p>
          </div>
        </div>
        <Button asChild variant="hero" size="sm" className="shrink-0">
          <Link to="/settings">ثبت موبایل</Link>
        </Button>
      </div>
    </div>
  );
}
