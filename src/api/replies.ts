import { api, type ReplyListItem } from "@/lib/api";

export function fetchReplies(threadId: string) {
  return api<{ items: ReplyListItem[]; nextCursor: string | null }>(`/api/threads/${threadId}/replies`, {
    authOptional: true,
  });
}

export function createReply(threadId: string, content: string) {
  return api<{ id: string }>(`/api/threads/${threadId}/replies`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ content }),
  });
}

export function uploadReplyImages(threadId: string, replyId: string, images: File[]) {
  const fd = new FormData();
  for (const f of images) fd.append("images", f);
  return api<{ attachments: unknown[] }>(`/api/threads/${threadId}/replies/${replyId}/images`, {
    method: "POST",
    auth: true,
    body: fd,
  });
}

export type AdminReplyItem = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; displayName: string };
  thread: { id: string; title: string };
};

export function fetchAdminReplies(params: { threadQ?: string; q?: string }) {
  const qs = new URLSearchParams();
  if (params.threadQ?.trim()) qs.set("threadQ", params.threadQ.trim());
  if (params.q?.trim()) qs.set("q", params.q.trim());
  return api<{ items: AdminReplyItem[]; nextCursor: string | null }>(
    `/api/admin/replies?${qs.toString()}`,
    { auth: true },
  );
}

export function updateAdminReply(id: string, content: string) {
  return api<{ id: string; content: string }>(`/api/admin/replies/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ content }),
  });
}

export function deleteAdminReply(id: string) {
  return api<{ ok: true }>(`/api/admin/replies/${id}`, { method: "DELETE", auth: true });
}
