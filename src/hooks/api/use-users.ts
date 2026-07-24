import { useQuery } from "@tanstack/react-query";
import { fetchUserLeaderboard, fetchUserPointsEvents, fetchUserProfile } from "@/api/users";
import { queryKeys } from "./keys";

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
