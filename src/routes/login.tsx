import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { ApiError } from "@/lib/api";
import { buildSeo } from "@/lib/seo";

type LoginValues = { email: string; password: string };

export const Route = createFileRoute("/login")({
  head: () => {
    const seo = buildSeo({
      title: "ورود",
      description: "ورود به حساب کاربری در Threadly.",
      path: "/login",
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { t } = useI18n();

  const loginSchema = z.object({
    email: z.string().email(t("auth.errorInvalidEmail")),
    password: z.string().min(6, t("auth.errorPasswordMin")),
  });
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      await auth.login(values.email, values.password);
      toast.success(t("auth.toastSignedIn"));
      void navigate({ to: "/" });
    } catch (e) {
      const err = e as ApiError;
      if (err?.status === 401) toast.error(t("auth.errorInvalidCredentials"));
      else toast.error(err?.message ?? "Error");
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-gradient-primary opacity-10" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="text-2xl font-extrabold">
            Threadly
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">{t("auth.signInSubtitle")}</p>
        </div>

        <Card className="border-border/60 bg-card/80 shadow-card backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <LogIn className="h-5 w-5" />
              </span>
              {t("auth.signIn")}
            </CardTitle>
            <CardDescription>{t("auth.enterEmailPassword")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              aria-label="فرم ورود"
            >
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...form.register("email")}
                  className={cn(form.formState.errors.email && "border-destructive focus-visible:ring-destructive")}
                />
                {form.formState.errors.email?.message ? (
                  <p className="text-xs font-medium text-destructive">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...form.register("password")}
                  className={cn(
                    form.formState.errors.password && "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {form.formState.errors.password?.message ? (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                ) : null}
              </div>

              <Button type="submit" variant="hero" className="w-full" disabled={form.formState.isSubmitting}>
                {t("auth.signIn")}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Link to="/register" className="font-medium text-primary hover:underline">
                  {t("auth.noAccount")}
                </Link>
                <Link to="/" className="text-muted-foreground hover:underline">
                  {t("auth.backHome")}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

