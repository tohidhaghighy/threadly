import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { buildSeo } from "@/lib/seo";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(6, "New password must be at least 6 characters."),
    confirmNewPassword: z.string().min(6, "Confirm password must be at least 6 characters."),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    message: "Passwords do not match.",
    path: ["confirmNewPassword"],
  });

type Values = z.infer<typeof schema>;

export const Route = createFileRoute("/change-password")({
  head: () => {
    const seo = buildSeo({
      title: "تغییر رمز عبور",
      description: "تغییر رمز عبور حساب کاربری در Threadly.",
      path: "/change-password",
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: Values) => {
    if (!auth.token) {
      toast.error("Please sign in first.");
      void navigate({ to: "/login" });
      return;
    }

    await api<{ ok: true }>("/api/auth/change-password", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
    });

    form.reset();
    toast.success(t("password.toastUpdated"));
    void navigate({ to: "/" });
  };

  if (!auth.token) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10 md:px-8">
        <Card className="border-border/60 bg-card shadow-card">
          <CardHeader>
            <CardTitle>{t("password.signInRequiredTitle")}</CardTitle>
            <CardDescription>{t("password.signInRequiredDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <Button asChild variant="hero">
              <Link to="/login">{t("password.goSignIn")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">{t("auth.backHome")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 md:px-8">
      <Card className="border-border/60 bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <KeyRound className="h-5 w-5" />
            </span>
            {t("password.title")}
          </CardTitle>
          <CardDescription>{t("password.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("password.current")}</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...form.register("currentPassword")}
                className={cn(
                  form.formState.errors.currentPassword && "border-destructive focus-visible:ring-destructive",
                )}
              />
              {form.formState.errors.currentPassword?.message ? (
                <p className="text-xs font-medium text-destructive">{form.formState.errors.currentPassword.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("password.new")}</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...form.register("newPassword")}
                className={cn(form.formState.errors.newPassword && "border-destructive focus-visible:ring-destructive")}
              />
              {form.formState.errors.newPassword?.message ? (
                <p className="text-xs font-medium text-destructive">{form.formState.errors.newPassword.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">{t("password.confirm")}</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                {...form.register("confirmNewPassword")}
                className={cn(
                  form.formState.errors.confirmNewPassword && "border-destructive focus-visible:ring-destructive",
                )}
              />
              {form.formState.errors.confirmNewPassword?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.confirmNewPassword.message}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button asChild variant="outline">
                <Link to="/">{t("password.cancel")}</Link>
              </Button>
              <Button type="submit" variant="hero" disabled={form.formState.isSubmitting}>
                {t("password.update")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

