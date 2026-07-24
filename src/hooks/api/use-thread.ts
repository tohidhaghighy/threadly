import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchThread, recordThreadView, setBestReply, toggleThreadLike } from "@/api/threads";
import { queryKeys } from "./keys";

export function useThread(id: string) {
  return useQuery({
    queryKey: queryKeys.thread(id),
    queryFn: () => fetchThread(id, true),
  });
}

export function useRecordThreadView(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => recordThreadView(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.thread(id) });
      await qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });
}

export function useToggleThreadLike(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => toggleThreadLike(threadId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.thread(threadId) });
      await qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });
}

export function useSetBestReply(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (replyId: string) => setBestReply(threadId, replyId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.replies(threadId) });
      await qc.invalidateQueries({ queryKey: queryKeys.thread(threadId) });
      await qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });
}
