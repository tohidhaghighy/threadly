import { useSyncExternalStore } from "react";
import { adminQueue, replies as seedReplies, threads as seedThreads } from "@/lib/mock-data";

export type ThreadStatus = "pending" | "approved" | "rejected";

export type ThreadAuthor = {
  name: string;
  avatar: string;
};

export type ForumThread = {
  id: string;
  title: string;
  author: ThreadAuthor;
  category: string;
  tags: string[];
  replies: number;
  views: number;
  likes: number;
  time: string;
  excerpt: string;
  pinned?: boolean;
  hot?: boolean;
  status: ThreadStatus;
  content?: string;
  images?: { name: string; type: string; size: number }[];
};

export type ForumReply = {
  id: string;
  author: { name: string; avatar: string; role?: string };
  time: string;
  likes: number;
  content: string;
  code?: string;
};

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "banned";

export type ForumUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
};

type ForumState = {
  threads: ForumThread[];
  repliesByThreadId: Record<string, ForumReply[]>;
  users: ForumUser[];
};

const STORAGE_KEY = "pc-build-hub.forumState.v1";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return (a + b).toUpperCase();
}

function seedState(): ForumState {
  const approvedSeedThreads: ForumThread[] = seedThreads.map((t) => ({
    ...t,
    status: "approved",
    content: t.excerpt,
  }));

  const pendingFromAdminQueue: ForumThread[] = adminQueue.map((q) => ({
    id: q.id,
    title: q.title,
    author: { name: q.author, avatar: initials(q.author) },
    category: q.category,
    tags: [],
    replies: 0,
    views: 0,
    likes: 0,
    time: q.date,
    excerpt: "This thread was submitted for review and will be published after admin approval.",
    status: q.status,
    content: q.title,
  }));

  return {
    threads: [...approvedSeedThreads, ...pendingFromAdminQueue],
    repliesByThreadId: {
      "1": seedReplies,
    },
    users: [
      {
        id: "u_admin",
        name: "Threadly Admin",
        email: "admin@threadly.local",
        role: "admin",
        status: "active",
        joinedAt: "2026-01-01",
      },
      {
        id: "u_guest",
        name: "Guest User",
        email: "guest@threadly.local",
        role: "user",
        status: "active",
        joinedAt: "2026-05-01",
      },
      {
        id: "u_sara",
        name: "Sara Mohammadi",
        email: "sara@example.com",
        role: "user",
        status: "active",
        joinedAt: "2026-04-12",
      },
      {
        id: "u_spam",
        name: "spammer123",
        email: "spam@example.com",
        role: "user",
        status: "banned",
        joinedAt: "2026-04-30",
      },
    ],
  };
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

let state: ForumState = seedState();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function save() {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  if (!isBrowser()) return;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    state = JSON.parse(raw) as ForumState;
  } catch {
    // ignore corrupted storage; keep seed
  }
}

// Initialize from localStorage (client only)
load();

export function getForumState(): ForumState {
  return state;
}

export function subscribeForumStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getForumThreadById(id: string): ForumThread | undefined {
  return state.threads.find((t) => t.id === id);
}

export function getApprovedThreads(): ForumThread[] {
  return state.threads.filter((t) => t.status === "approved");
}

export function getThreadsByStatus(status: ThreadStatus | "all"): ForumThread[] {
  return status === "all" ? state.threads : state.threads.filter((t) => t.status === status);
}

export function getRepliesForThread(threadId: string): ForumReply[] {
  return state.repliesByThreadId[threadId] ?? [];
}

export function createPendingThread(input: {
  title: string;
  category: string;
  tags: string[];
  content: string;
  authorName: string;
  images?: { name: string; type: string; size: number }[];
}) {
  const id = String(Date.now());
  const now = new Date();
  const time = now.toLocaleDateString("fa-IR");

  const thread: ForumThread = {
    id,
    title: input.title,
    author: { name: input.authorName, avatar: initials(input.authorName) },
    category: input.category,
    tags: input.tags,
    replies: 0,
    views: 0,
    likes: 0,
    time,
    excerpt: input.content.slice(0, 160) + (input.content.length > 160 ? "..." : ""),
    status: "pending",
    content: input.content,
    images: input.images ?? [],
  };

  state = { ...state, threads: [thread, ...state.threads] };
  save();
  emit();
  return id;
}

export function approveThread(id: string) {
  state = {
    ...state,
    threads: state.threads.map((t) => (t.id === id ? { ...t, status: "approved" } : t)),
  };
  save();
  emit();
}

export function rejectThread(id: string) {
  state = {
    ...state,
    threads: state.threads.map((t) => (t.id === id ? { ...t, status: "rejected" } : t)),
  };
  save();
  emit();
}

export function addReply(threadId: string, input: { content: string; authorName: string }) {
  const reply: ForumReply = {
    id: `r_${Date.now()}`,
    author: { name: input.authorName, avatar: initials(input.authorName) },
    time: "Just now",
    likes: 0,
    content: input.content,
  };

  const prev = state.repliesByThreadId[threadId] ?? [];
  state = {
    ...state,
    repliesByThreadId: { ...state.repliesByThreadId, [threadId]: [...prev, reply] },
    threads: state.threads.map((t) => (t.id === threadId ? { ...t, replies: (t.replies ?? 0) + 1 } : t)),
  };
  save();
  emit();
}

export function setUserRole(userId: string, role: UserRole) {
  state = {
    ...state,
    users: state.users.map((u) => (u.id === userId ? { ...u, role } : u)),
  };
  save();
  emit();
}

export function toggleUserBan(userId: string) {
  state = {
    ...state,
    users: state.users.map((u) =>
      u.id === userId ? { ...u, status: u.status === "banned" ? "active" : "banned" } : u,
    ),
  };
  save();
  emit();
}

export function useForumState(): ForumState {
  return useSyncExternalStore(subscribeForumStore, () => state, () => state);
}

