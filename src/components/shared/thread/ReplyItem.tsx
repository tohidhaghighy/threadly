import { CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ReplyListItem } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReplyActions } from "@/components/ReplyActions";
import { RichTextContent } from "@/components/shared/rich-text";

type ReplyItemProps = {
  reply: ReplyListItem;
  threadId: string;
  canPickBestAnswer: boolean;
  onToggleBest: (replyId: string) => void;
  bestBusy?: boolean;
};

export function ReplyItem({ reply, threadId, canPickBestAnswer, onToggleBest, bestBusy }: ReplyItemProps) {
  return (
    <div
      id={`reply-${reply.id}`}
      className="scroll-mt-24 rounded-xl border border-border/60 bg-card p-5 shadow-card"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-border">
          {reply.author.avatarUrl ? (
            <AvatarImage src={reply.author.avatarUrl} alt={reply.author.displayName} />
          ) : null}
          <AvatarFallback className="bg-secondary text-sm font-bold">
            {(reply.author.displayName[0] ?? "ک").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{reply.author.displayName}</span>
            {reply.isBest ? (
              <Badge className="gap-1 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                پاسخ برتر
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground">
              • {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
            </span>
          </div>
          <RichTextContent html={reply.content} className="mt-2 text-foreground/90" />
          {(reply.attachments ?? []).length ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {reply.attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative overflow-hidden rounded-lg border border-border/60 bg-muted/20"
                  title="باز کردن تصویر"
                >
                  <img
                    src={a.url}
                    alt="تصویر ضمیمه"
                    className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          ) : null}
          <ReplyActions reply={reply} threadId={threadId} />
          {canPickBestAnswer ? (
            <div className="mt-2">
              <Button
                variant={reply.isBest ? "outline" : "secondary"}
                size="sm"
                disabled={bestBusy}
                onClick={() => onToggleBest(reply.id)}
              >
                <CheckCircle2 className="h-4 w-4" />
                {reply.isBest ? "حذف پاسخ برتر" : "انتخاب به عنوان پاسخ برتر"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
