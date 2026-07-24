import { useEffect, useMemo, useRef, useState } from "react";
import { Coins, Image as ImageIcon, Send } from "lucide-react";
import { toast } from "sonner";
import type { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/shared/rich-text";
import { stripHtmlToText } from "@/lib/sanitize-html";
import { useCreateReply } from "@/hooks/api";
import { cardInnerShadowClasses } from "@/styles/shared/page";

type ReplyComposerProps = {
  threadId: string;
  canPost: boolean;
  disabled?: boolean;
};

export function ReplyComposer({ threadId, canPost, disabled }: ReplyComposerProps) {
  const [answer, setAnswer] = useState("");
  const [replyImages, setReplyImages] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const createReply = useCreateReply(threadId);

  const replyImagePreviews = useMemo(
    () => replyImages.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [replyImages],
  );

  useEffect(() => {
    return () => {
      for (const it of replyImagePreviews) URL.revokeObjectURL(it.url);
    };
  }, [replyImagePreviews]);

  return (
    <div className={`mt-6 ${cardInnerShadowClasses}`}>
      <p className="mb-3 text-sm font-semibold">پاسخ شما</p>
      <RichTextEditor
        value={answer}
        onChange={setAnswer}
        placeholder="پاسخ خود را بنویسید…"
        minHeightClassName="min-h-48"
        variant="user"
        disabled={!canPost || disabled}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          const onlyImages = files.filter((f) => f.type.startsWith("image/"));
          if (onlyImages.length !== files.length) toast.error("فقط فایل تصویری مجاز است.");
          setReplyImages((prev) => [...prev, ...onlyImages]);
          e.currentTarget.value = "";
        }}
      />
      {replyImages.length ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {replyImagePreviews.map(({ file: f, url }) => (
            <button
              key={`${f.name}-${f.size}-${f.lastModified}`}
              type="button"
              className="group relative overflow-hidden rounded-lg border border-border/60 bg-muted/20"
              title="حذف تصویر"
              onClick={() => {
                URL.revokeObjectURL(url);
                setReplyImages((prev) => prev.filter((x) => x !== f));
              }}
            >
              <img src={url} alt={f.name} className="h-20 w-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 transition group-hover:opacity-100" />
              <span className="absolute bottom-1 end-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                حذف
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileRef.current?.click()}
          disabled={!canPost}
          title={canPost ? "افزودن تصویر" : "برای ارسال پاسخ وارد شوید"}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="hero"
          size="sm"
          disabled={!canPost || disabled || createReply.isPending}
          onClick={async () => {
            const body = answer.trim();
            if (!stripHtmlToText(body)) {
              toast.error("متن پاسخ خیلی کوتاه است.");
              return;
            }
            try {
              await createReply.mutateAsync({ content: body, images: replyImages });
              setAnswer("");
              setReplyImages([]);
              toast.success("پاسخ ارسال شد — +۲ امتیاز", {
                icon: <Coins className="h-4 w-4 text-amber-500" />,
              });
            } catch (err) {
              const e = err as ApiError;
              toast.error(e?.message ?? "امکان ارسال پاسخ نیست. دوباره تلاش کنید.");
            }
          }}
        >
          <Send className="h-4 w-4" /> ارسال پاسخ
        </Button>
      </div>
    </div>
  );
}
