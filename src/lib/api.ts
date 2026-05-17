export type ApiError = { status: number; message: string; details?: unknown };

function getToken() {
  try {
    return localStorage.getItem("threadly_token");
  } catch {
    return null;
  }
}

export async function api<T>(path: string, init?: RequestInit & { auth?: boolean; authOptional?: boolean }): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (init?.auth || init?.authOptional) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(path, { ...init, headers });
  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const message =
      (json as any)?.message?.toString?.() ??
      (json as any)?.error?.toString?.() ??
      `Request failed (${res.status})`;
    throw { status: res.status, message, details: json } satisfies ApiError;
  }

  return json as T;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "banned";
  avatarUrl: string | null;
};

export type UserActivityBreakdown = { threads: number; comments: number; reactions: number };

export type UserLeaderboardItem = {
  id: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  rank: number;
  breakdown: UserActivityBreakdown;
};

export type UserProfile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  rank: number;
  breakdown: UserActivityBreakdown;
  totalUsers: number;
};

export type UserPointsEvent =
  | {
      id: string;
      type: "thread";
      points: 10;
      createdAt: string;
      thread: { id: string; title: string };
    }
  | {
      id: string;
      type: "reply";
      points: 2;
      createdAt: string;
      thread: { id: string; title: string };
      reply: { id: string; excerpt: string };
    }
  | {
      id: string;
      type: "reaction";
      points: 1;
      createdAt: string;
      emoji: string;
      thread: { id: string; title: string };
      reply: { id: string };
    };

export type ThreadListItem = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: { id: string; displayName: string; avatarUrl: string | null };
  status: "pending" | "approved" | "rejected";
  counts: { repliesCount: number; viewsCount: number; likesCount: number };
  createdAt: string;
  lastActivityAt: string;
};

export type ThreadDetail = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: { id: string; displayName: string; avatarUrl: string | null };
  status: "pending" | "approved" | "rejected";
  counts: { repliesCount: number; viewsCount: number; likesCount: number };
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  attachments: { id: string; url: string; mimeType: string; sizeBytes: number }[];
};

export type TagCatalogItem = { tag: string; count: number };

export type ReplyReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type ReplyListItem = {
  id: string;
  threadId: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
  content: string;
  createdAt: string;
  likesCount: number;
  likedByMe: boolean;
  reactions: ReplyReactionSummary[];
  attachments: { id: string; url: string; mimeType: string; sizeBytes: number }[];
};

export type UserAlertItem =
  | {
      id: string;
      type: "reply" | "mention";
      createdAt: string;
      message: string;
      thread: { id: string; title: string };
      reply: { id: string; excerpt: string };
      actor: { id: string; name: string; avatarUrl: string | null };
    }
  | {
      id: string;
      type: "thread_activity";
      createdAt: string;
      message: string;
      thread: { id: string; title: string };
    };

export type CategoryPublicItem = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isActive: boolean;
  threadsCount: number;
};

