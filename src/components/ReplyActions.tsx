import { useState } from "react";
import { Coins, Heart, SmilePlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api, type ApiError, type ReplyListItem } from "@/lib/api";
import { REPLY_REACTION_EMOJIS } from "@/lib/reply-reactions";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  reply: ReplyListItem;
  threadId: string;
};

export function ReplyActions({ reply, threadId }: Props) {
  const auth = useAuth();
  const qc = useQueryClient();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const requireAuth = () => {
    if (!auth.token) {
      toast.error(t("thread.interactionLoginRequired"));
      return false;
    }
    return true;
  };

  const invalidateReplies = async () => {
    await qc.invalidateQueries({ queryKey: ["replies", threadId] });
  };

  const toggleLike = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      await api<{ likesCount: number; likedByMe: boolean }>(`/api/replies/${reply.id}/like`, {
        method: "POST",
        auth: true,
      });
      await invalidateReplies();
    } catch (err) {
      const e = err as ApiError;
      toast.error(e?.message ?? t("thread.replyInteractionError"));
    } finally {
      setBusy(false);
    }
  };

  const toggleReaction = async (emoji: string) => {
    if (!requireAuth()) return;
    const alreadyReacted = !!reply.reactions.find((r) => r.emoji === emoji)?.reactedByMe;
    setBusy(true);
    try {
      await api<{ reactions: ReplyListItem["reactions"] }>(`/api/replies/${reply.id}/reactions`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ emoji }),
      });
      if (!alreadyReacted) {
        toast.success("+۱ امتیاز برای واکنش", {
          icon: <Coins className="h-4 w-4 text-amber-500" />,
        });
      }
      setOpen(false);
      await invalidateReplies();
    } catch (err) {
      const e = err as ApiError;
      toast.error(e?.message ?? t("thread.replyInteractionError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        className={cn(
          "h-8 gap-1.5 px-2 text-xs",
          reply.likedByMe && "text-primary",
        )}
        onClick={() => void toggleLike()}
      >
        <Heart className={cn("h-3.5 w-3.5", reply.likedByMe && "fill-current")} />
        {reply.likesCount.toLocaleString("fa-IR")}
      </Button>

      {reply.reactions.map((r) => (
        <Button
          key={r.emoji}
          type="button"
          variant={r.reactedByMe ? "secondary" : "outline"}
          size="sm"
          disabled={busy}
          className="h-8 min-w-9 gap-1 px-2 text-xs"
          onClick={() => void toggleReaction(r.emoji)}
          title={r.reactedByMe ? r.emoji : r.emoji}
        >
          <span className="leading-none">{r.emoji}</span>
          <span className="text-muted-foreground">{r.count.toLocaleString("fa-IR")}</span>
        </Button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs text-muted-foreground"
            disabled={busy}
            aria-label={t("thread.addReaction")}
          >
            <SmilePlus className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start" dir="rtl">
          <div className="grid grid-cols-4 gap-1">
            {REPLY_REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                disabled={busy}
                className="flex h-10 w-10 items-center justify-center rounded-md text-lg transition hover:bg-muted"
                onClick={() => void toggleReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
