import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { ApiError } from "@/lib/api";
import { buildSeo } from "@/lib/seo";

type RegisterValues = { name: string; email: string; password: string; confirmPassword: string };

export const Route = createFileRoute("/register")({
  head: () => {
    const seo = buildSeo({
      title: "ثبت‌نام",
      description: "ایجاد حساب کاربری جدید در Threadly.",
      path: "/register",
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { t } = useI18n();

  const registerSchema = z
    .object({
      name: z.string().min(2, t("auth.errorNameMin")),
      email: z.string().email(t("auth.errorInvalidEmail")),
      password: z.string().min(6, t("auth.errorPasswordMin")),
      confirmPassword: z.string().min(6, t("auth.errorConfirmPasswordMin")),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: t("auth.errorPasswordsDontMatch"),
      path: ["confirmPassword"],
    });
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      await auth.register(values.name, values.email, values.password);
      toast.success(t("auth.toastAccountCreated"));
      void navigate({ to: "/" });
    } catch (e) {
      const err = e as ApiError;
      if (err?.status === 409) toast.error(t("auth.errorEmailExists"));
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
          <p className="mt-2 text-sm text-muted-foreground">{t("auth.signUpSubtitle")}</p>
        </div>

        <Card className="border-border/60 bg-card/80 shadow-card backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <UserPlus className="h-5 w-5" />
              </span>
              {t("auth.createAccount")}
            </CardTitle>
            <CardDescription>{t("auth.signupHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              aria-label="فرم ثبت‌نام"
            >
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="e.g. Alex Johnson"
                  {...form.register("name")}
                  className={cn(form.formState.errors.name && "border-destructive focus-visible:ring-destructive")}
                />
                {form.formState.errors.name?.message ? (
                  <p className="text-xs font-medium text-destructive">{form.formState.errors.name.message}</p>
                ) : null}
              </div>

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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...form.register("confirmPassword")}
                    className={cn(
                      form.formState.errors.confirmPassword &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {form.formState.errors.confirmPassword?.message ? (
                    <p className="text-xs font-medium text-destructive">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full" disabled={form.formState.isSubmitting}>
                {t("auth.createAccount")}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Link to="/login" className="font-medium text-primary hover:underline">
                  {t("auth.haveAccount")}
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

