/** Central React Query keys for API hooks. */
export const queryKeys = {
  categories: ["categories"] as const,
  pageSeo: (pageKey: string) => ["pageSeo", pageKey] as const,
  pageSeoAll: ["pageSeo", "all"] as const,
  adminPageSeo: ["adminPageSeo"] as const,
  avatarSamples: ["avatarSamples"] as const,
  thread: (id: string) => ["thread", id] as const,
  replies: (threadId: string) => ["replies", threadId] as const,
  threads: (filters: unknown) => ["threads", filters] as const,
  usersLeaderboard: ["usersLeaderboard"] as const,
  userProfile: (id: string) => ["userProfile", id] as const,
  userPointsEvents: (id: string) => ["userPointsEvents", id] as const,
  adminReplies: (threadQ: string, q: string) => ["adminReplies", threadQ, q] as const,
};
