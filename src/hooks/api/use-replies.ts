import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createReply, fetchReplies, uploadReplyImages } from "@/api/replies";
import { queryKeys } from "./keys";

export function useReplies(threadId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.replies(threadId),
    queryFn: () => fetchReplies(threadId),
    enabled,
  });
}

export function useCreateReply(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, images }: { content: string; images?: File[] }) => {
      const created = await createReply(threadId, content);
      if (images?.length) {
        await uploadReplyImages(threadId, created.id, images);
      }
      return created;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.replies(threadId) });
      await qc.invalidateQueries({ queryKey: queryKeys.thread(threadId) });
    },
  });
}
