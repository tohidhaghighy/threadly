import { MessageCircle, Eye, Pin, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Thread = {
  id: string;
  title: string;
  author: { name: string; avatar: string; avatarUrl?: string | null };
  category: string;
  tags: string[];
  replies: number;
  views: number;
  likes: number;
  time: string;
  excerpt: string;
  pinned?: boolean;
  hot?: boolean;
};

export function ThreadCard({ thread }: { thread: Thread }) {
  return (
    <div className="group relative block overflow-hidden rounded-xl border border-border/60 bg-card p-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border sm:h-11 sm:w-11">
          {thread.author.avatarUrl ? <AvatarImage src={thread.author.avatarUrl} alt={thread.author.name} /> : null}
          <AvatarFallback className="bg-gradient-primary text-sm font-bold text-primary-foreground">
            {thread.author.avatar}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {thread.pinned && (
              <Badge variant="secondary" className="gap-1 bg-primary/15 text-primary">
                <Pin className="h-3 w-3" />سنجاق‌شده
              </Badge>
            )}
            {thread.hot && (
              <Badge variant="secondary" className="gap-1 bg-destructive/15 text-destructive">
                <Flame className="h-3 w-3" />داغ
              </Badge>
            )}
            <Badge variant="outline" className="border-primary/30 text-primary">{thread.category}</Badge>
            <span className="text-xs text-muted-foreground">• {thread.time}</span>
          </div>

          <h3 className="mt-2 line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-primary md:text-lg">
            {thread.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{thread.excerpt}</p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {thread.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                {thread.replies}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {thread.views.toLocaleString("fa-IR")}
              </span>
            </div>
          </div>

          <p className="mt-2 text-xs font-medium text-foreground/80">{thread.author.name}</p>
        </div>
      </div>
    </div>
  );
}
