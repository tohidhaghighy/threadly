import { api, type OnlineUser, type ThreadListItem, type UserAlertItem, type UserLeaderboardItem, type UserPointsEvent, type UserProfile, type UserProfileContact } from "@/lib/api";

export function fetchAvatarSamples() {
  return api<{ items: { url: string }[] }>("/api/users/avatar-samples");
}

export function updateMyProfile(payload: UserProfileContact) {
  return api<UserProfileContact>("/api/users/me/profile", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function uploadMyAvatar(file: File | null) {
  const fd = new FormData();
  if (file) fd.append("avatar", file);
  return api<{ avatarUrl: string | null }>("/api/users/me/avatar", {
    method: "POST",
    auth: true,
    body: fd,
  });
}

export function selectAvatarSample(url: string) {
  return api<{ avatarUrl: string | null }>("/api/users/me/avatar-sample", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ url }),
  });
}

export function fetchUserLeaderboard(limit = 100) {
  return api<{ items: UserLeaderboardItem[]; nextCursor: string | null }>(
    `/api/users/leaderboard?limit=${limit}`,
  );
}

export function fetchUserProfile(id: string) {
  return api<UserProfile>(`/api/users/${id}/profile`, { authOptional: true });
}

export function fetchUserPointsEvents(id: string, limit = 100) {
  return api<{ items: UserPointsEvent[]; nextCursor: string | null }>(
    `/api/users/${id}/points-events?limit=${limit}`,
  );
}

export function fetchMyAlerts(limit = 200) {
  return api<{ items: UserAlertItem[]; nextCursor: string | null }>(
    `/api/users/me/alerts?limit=${limit}`,
    { auth: true },
  );
}

export function touchPresence() {
  return api<{ ok: boolean }>("/api/users/me/presence", { method: "POST", auth: true });
}

export function fetchOnlineUsers() {
  return api<{ items: OnlineUser[] }>("/api/users/online", { authOptional: true });
}

export function followUser(id: string) {
  return api<{ followed: boolean }>(`/api/users/${id}/follow`, { method: "POST", auth: true });
}

export function unfollowUser(id: string) {
  return api<{ followed: boolean }>(`/api/users/${id}/follow`, { method: "DELETE", auth: true });
}

export function fetchFollowingThreads() {
  return api<{ items: ThreadListItem[]; nextCursor: string | null }>("/api/users/me/following/threads", {
    auth: true,
  });
}
