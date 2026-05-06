export type ApiError = { status: number; message: string; details?: unknown };

function getToken() {
  try {
    return localStorage.getItem("threadly_token");
  } catch {
    return null;
  }
}

export async function api<T>(path: string, init?: RequestInit & { auth?: boolean }): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (init?.auth) {
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

export type AuthUser = { id: string; name: string; email: string; role: "user" | "admin"; status: "active" | "banned" };

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
  createdAt: string;
  updatedAt: string;
  attachments: { id: string; url: string; mimeType: string; sizeBytes: number }[];
};

export type ReplyListItem = {
  id: string;
  threadId: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
  content: string;
  createdAt: string;
  likesCount: number;
};

export type CategoryPublicItem = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isActive: boolean;
  threadsCount: number;
};

