import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFollowingThreads,
  fetchOnlineUsers,
  fetchUserLeaderboard,
  fetchUserPointsEvents,
  fetchUserProfile,
  followUser,
  touchPresence,
  unfollowUser,
} from "@/features/users/api";
import { queryKeys } from "@/lib/query-keys";

export function useUsersLeaderboard(limit = 100) {
  return useQuery({
    queryKey: queryKeys.usersLeaderboard,
    queryFn: () => fetchUserLeaderboard(limit),
  });
}

export function useUserProfile(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.userProfile(id),
    queryFn: () => fetchUserProfile(id),
    enabled: (options?.enabled ?? true) && !!id,
  });
}

export function useUserPointsEvents(id: string, limit = 100) {
  return useQuery({
    queryKey: queryKeys.userPointsEvents(id),
    queryFn: () => fetchUserPointsEvents(id, limit),
  });
}

export function useOnlineUsers() {
  return useQuery({
    queryKey: queryKeys.onlineUsers,
    queryFn: fetchOnlineUsers,
    refetchInterval: 20_000,
  });
}

export function usePresenceHeartbeat(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const ping = () => {
      void touchPresence()
        .then(() => {
          if (!cancelled) void qc.invalidateQueries({ queryKey: queryKeys.onlineUsers });
        })
        .catch(() => {
          // Ignore transient presence errors; the next tick will retry.
        });
    };
    ping();
    const timer = window.setInterval(ping, 25_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled, qc]);
}

export function useFollowToggle(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (followed: boolean) => (followed ? unfollowUser(userId) : followUser(userId)),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
      await qc.invalidateQueries({ queryKey: queryKeys.onlineUsers });
      await qc.invalidateQueries({ queryKey: queryKeys.followingThreads });
    },
  });
}

export function useFollowingThreads(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.followingThreads,
    queryFn: fetchFollowingThreads,
    enabled,
  });
}
