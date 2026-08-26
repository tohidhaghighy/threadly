import { api } from "@/lib/api";

export type AdminUserDetail = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    status: "active" | "banned";
    avatarUrl: string | null;
    phone: string | null;
    joinedAt: string;
    adminDeletedRepliesCount: number;
  };
  counts: { threads: number; comments: number; reactions: number };
  threads: Array<{
    id: string;
    title: string;
    category: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    repliesCount: number;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    thread: { id: string; title: string };
  }>;
  reactions: Array<{
    id: string;
    emoji: string;
    createdAt: string;
    replyId: string | null;
    thread: { id: string; title: string };
  }>;
};

export function fetchAdminUserDetail(id: string) {
  return api<AdminUserDetail>(`/api/admin/users/${id}`, { auth: true });
}

export function deleteAdminThread(id: string) {
  return api<{ ok: true }>(`/api/admin/threads/${id}`, { method: "DELETE", auth: true });
}

export function deleteAdminReaction(id: string) {
  return api<{ ok: true }>(`/api/admin/reactions/${id}`, { method: "DELETE", auth: true });
}
