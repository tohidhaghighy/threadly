import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/auth-context";
import { useOnlineUsers, usePresenceHeartbeat } from "@/features/users/hooks";
import type { OnlineUser } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatLastSeen(iso: string, isOnline: boolean) {
  const diff = Date.now() - new Date(iso).getTime();
  if (isOnline && diff < 45_000) return "آنلاین";
  const minutes = Math.max(1, Math.floor(diff / 60_000));
  if (minutes < 60) return `${minutes.toLocaleString("fa-IR")} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours.toLocaleString("fa-IR")} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${days.toLocaleString("fa-IR")} روز پیش`;
}

function StoryAvatar({ user }: { user: OnlineUser }) {
  const initial = (user.name[0] ?? "U").toUpperCase();
  return (
    <Link
      to="/users/$id"
      params={{ id: user.id }}
      className="flex w-[4.6rem] shrink-0 snap-start flex-col items-center gap-1 sm:w-20"
    >
      <span
        className={cn(
          "rounded-full p-[3px]",
          user.isOnline ? "bg-gradient-primary" : "bg-border",
        )}
      >
        <span className="block rounded-full bg-background p-[2px]">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
            <AvatarFallback className="bg-gradient-primary text-base font-extrabold text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
        </span>
      </span>
      <span className="line-clamp-2 w-full text-center text-[11px] font-semibold leading-tight text-foreground">
        {user.isMe ? "شما" : user.name}
      </span>
      <span className={cn("text-[10px] leading-none", user.isOnline ? "font-semibold text-primary" : "text-muted-foreground")}>
        {formatLastSeen(user.lastSeenAt, user.isOnline)}
      </span>
    </Link>
  );
}

export function OnlineUsersBar() {
  const auth = useAuth();
  usePresenceHeartbeat(!!auth.token);
  const online = useOnlineUsers();
  const items = online.data?.items ?? [];
  if (!items.length) return null;

  return (
    <div className="border-t border-border/50 bg-background/70">
      <div className="mx-auto flex max-w-7xl items-start gap-3 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] snap-x snap-mandatory sm:gap-4 sm:px-4 [&::-webkit-scrollbar]:hidden">
        {auth.token ? (
          <Link to="/following" className="flex w-[4.6rem] shrink-0 snap-start flex-col items-center gap-1 sm:w-20">
            <span className="rounded-full bg-gradient-primary p-[3px]">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background sm:h-16 sm:w-16">
                <Users className="h-6 w-6 text-primary" />
              </span>
            </span>
            <span className="line-clamp-2 w-full text-center text-[11px] font-semibold leading-tight">دنبال‌شده‌ها</span>
            <span className="text-[10px] leading-none text-muted-foreground">گفتگوها</span>
          </Link>
        ) : null}
        {items.map((user) => (
          <StoryAvatar key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
