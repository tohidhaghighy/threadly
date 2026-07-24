import { api, type UserLeaderboardItem, type UserPointsEvent, type UserProfile, type UserProfileContact } from "@/lib/api";

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
  return api<UserProfile>(`/api/users/${id}/profile`);
}

export function fetchUserPointsEvents(id: string, limit = 100) {
  return api<{ items: UserPointsEvent[]; nextCursor: string | null }>(
    `/api/users/${id}/points-events?limit=${limit}`,
  );
}
