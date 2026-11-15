import { api, type ThreadDetail, type ThreadListItem } from "@/lib/api";

export type ThreadListResponse = { items: ThreadListItem[]; nextCursor: string | null };

export function fetchThread(id: string, authOptional = true) {
  return api<ThreadDetail>(`/api/threads/${id}`, { authOptional });
}

export function recordThreadView(id: string) {
  return api<{ viewsCount: number }>(`/api/threads/${id}/view`, {
    method: "POST",
    authOptional: true,
  });
}

export function toggleThreadLike(id: string) {
  return api<{ likesCount: number; likedByMe: boolean }>(`/api/threads/${id}/like`, {
    method: "POST",
    auth: true,
  });
}

export function setBestReply(threadId: string, replyId: string) {
  return api<{ bestReplyId: string | null }>(`/api/threads/${threadId}/best-reply/${replyId}`, {
    method: "POST",
    auth: true,
  });
}

export function fetchThreads(query: string) {
  return api<ThreadListResponse>(`/api/threads?${query}`);
}

export type CreateThreadPayload = {
  title: string;
  content: string;
  category: string;
  tags: string[];
  language?: "fa" | "en";
};

export function createThread(payload: CreateThreadPayload) {
  return api<{ id: string; status: "pending" }>("/api/threads", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function uploadThreadImages(threadId: string, images: File[]) {
  const fd = new FormData();
  for (const f of images) fd.append("images", f);
  return api<{ attachments: unknown[] }>(`/api/threads/${threadId}/images`, {
    method: "POST",
    auth: true,
    body: fd,
  });
}
