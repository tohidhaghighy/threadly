import { Camera } from "lucide-react";
import { toast } from "sonner";
import type { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvatarSamples, useSelectAvatarSample, useUploadAvatar } from "@/hooks/api";
import { cardInnerPanelClasses, cardInnerShadowClasses } from "@/styles/shared/page";

type AvatarPickerProps = {
  onChanged: () => Promise<void>;
};

export function AvatarPicker({ onChanged }: AvatarPickerProps) {
  const samplesQ = useAvatarSamples();
  const uploadAvatar = useUploadAvatar();
  const selectSample = useSelectAvatarSample();

  const handleError = (err: unknown) => {
    const apiErr = err as ApiError;
    toast.error(apiErr?.message ?? "عملیات ناموفق بود");
  };

  return (
    <>
      <div className={cardInnerPanelClasses}>
        <p className="text-sm font-extrabold">آپلود تصویر</p>
        <p className="mt-1 text-xs text-muted-foreground">PNG/JPG/WebP تا ۲ مگابایت</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            id="avatarUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = "";
              if (!file) return;
              try {
                await uploadAvatar.mutateAsync(file);
                await onChanged();
                toast.success("عکس پروفایل به‌روزرسانی شد");
              } catch (err) {
                handleError(err);
              }
            }}
          />
          <Button asChild variant="outline" disabled={uploadAvatar.isPending}>
            <label htmlFor="avatarUpload" className="cursor-pointer">
              <Camera className="h-4 w-4" /> انتخاب فایل
            </label>
          </Button>
          <Button
            variant="ghost"
            type="button"
            disabled={uploadAvatar.isPending}
            onClick={async () => {
              try {
                await uploadAvatar.mutateAsync(null);
                await onChanged();
                toast.success("عکس پروفایل حذف شد");
              } catch (err) {
                handleError(err);
              }
            }}
          >
            حذف عکس
          </Button>
        </div>
      </div>

      <div className={`mt-6 ${cardInnerShadowClasses}`}>
        <p className="text-sm font-extrabold">آواتارهای نمونه</p>
        <p className="mt-1 text-xs text-muted-foreground">برای انتخاب کلیک کنید</p>

        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {samplesQ.isLoading
            ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-14 w-14 rounded-full" />)
            : (samplesQ.data?.items ?? []).map((s) => (
                <button
                  key={s.url}
                  type="button"
                  className="group rounded-full ring-offset-background transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
                  disabled={selectSample.isPending}
                  onClick={async () => {
                    try {
                      await selectSample.mutateAsync(s.url);
                      await onChanged();
                      toast.success("آواتار انتخاب شد");
                    } catch (err) {
                      handleError(err);
                    }
                  }}
                  title="انتخاب آواتار"
                >
                  <img src={s.url} alt="sample avatar" className="h-14 w-14 rounded-full border border-border/60" />
                </button>
              ))}
        </div>
      </div>
    </>
  );
}
