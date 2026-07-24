import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { ApiError } from "@/lib/api";
import type { AuthUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpdateUserProfile } from "@/hooks/api";
import { formatCardDisplay, parseProfileContactForm, profileContactToForm } from "@/lib/format/profile";
import { levelFromPoints } from "@/lib/gamification";
import { PHONE_REQUIRED_MIN_LEVEL } from "@/lib/points";
import { useUserProfile } from "@/hooks/api";

type ProfileContactFormProps = {
  user: AuthUser;
  onSaved: () => Promise<void>;
};

export function ProfileContactForm({ user, onSaved }: ProfileContactFormProps) {
  const updateProfile = useUpdateUserProfile();
  const profileQuery = useUserProfile(user.id);
  const phoneRequired =
    levelFromPoints(profileQuery.data?.points ?? 0).level >= PHONE_REQUIRED_MIN_LEVEL;
  const [phone, setPhone] = useState("");
  const [bankShaba, setBankShaba] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");

  useEffect(() => {
    const form = profileContactToForm(user);
    setPhone(form.phone);
    setBankShaba(form.bankShaba);
    setCardNumber(form.cardNumber);
    setBirthDate(form.birthDate);
  }, [user]);

  return (
    <>
      <div className="flex items-center gap-4 border-b border-border/60 bg-gradient-to-l from-primary/10 to-transparent p-6">
        <Avatar className="h-16 w-16 ring-2 ring-primary/30">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
          <AvatarFallback className="bg-gradient-primary text-lg font-extrabold text-primary-foreground">
            {(user.name?.slice(0, 2) ?? "U").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold">اطلاعات تماس و بانکی</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            فقط برای خودتان قابل مشاهده است و در پروفایل عمومی نمایش داده نمی‌شود.
          </p>
          {phoneRequired ? (
            <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              از سطح ۴ به بعد، ثبت شماره موبایل الزامی است تا پشتیبانی بتواند برای جوایز یا تماس با شما ارتباط بگیرد.
            </p>
          ) : null}
        </div>
      </div>

      <form
        className="space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (phoneRequired && !phone.trim()) {
            toast.error("از سطح ۴ به بعد، ثبت شماره موبایل الزامی است.");
            return;
          }
          try {
            await updateProfile.mutateAsync(
              parseProfileContactForm({ phone, bankShaba, cardNumber, birthDate }),
            );
            await onSaved();
            toast.success("اطلاعات پروفایل ذخیره شد");
          } catch (err) {
            const apiErr = err as ApiError;
            toast.error(apiErr?.message ?? "ذخیره ناموفق بود");
          }
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="phone">
            شماره موبایل{phoneRequired ? <span className="text-destructive"> *</span> : null}
          </Label>
          <Input
            id="phone"
            inputMode="tel"
            dir="ltr"
            className="text-start"
            placeholder="09123456789"
            value={phone}
            required={phoneRequired}
            onChange={(e) => setPhone(e.target.value)}
          />
          {phoneRequired ? (
            <p className="text-xs text-muted-foreground">
              برای تماس پشتیبانی در همکاری و جوایز استفاده می‌شود.
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bankShaba">شماره شبا</Label>
          <Input
            id="bankShaba"
            dir="ltr"
            className="text-start font-mono uppercase"
            placeholder="IR120170000000100000000001"
            value={bankShaba}
            onChange={(e) => setBankShaba(e.target.value.toUpperCase())}
          />
          <p className="text-xs text-muted-foreground">فرمت: IR به‌علاوه ۲۴ رقم</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cardNumber">شماره کارت بانکی</Label>
          <Input
            id="cardNumber"
            inputMode="numeric"
            dir="ltr"
            className="text-start font-mono"
            placeholder="6037 9912 3456 7890"
            value={cardNumber}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
              setCardNumber(formatCardDisplay(digits));
            }}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="birthDate">تاریخ تولد</Label>
          <Input
            id="birthDate"
            type="date"
            dir="ltr"
            className="text-start"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>

        <Button type="submit" variant="hero" disabled={updateProfile.isPending} className="w-full sm:w-auto">
          <Save className="h-4 w-4" />
          ذخیره اطلاعات
        </Button>
      </form>
    </>
  );
}
