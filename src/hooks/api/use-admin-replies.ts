import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteAdminReply, fetchAdminReplies, updateAdminReply } from "@/api/replies";
import { queryKeys } from "./keys";

export function useAdminReplies(threadQ: string, q: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminReplies(threadQ.trim(), q.trim()),
    queryFn: () => fetchAdminReplies({ threadQ, q }),
    enabled,
  });
}

export function useUpdateAdminReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => updateAdminReply(id, content),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["adminReplies"] });
    },
  });
}

export function useDeleteAdminReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminReply(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["adminReplies"] });
      await qc.invalidateQueries({ queryKey: ["replies"] });
      await qc.invalidateQueries({ queryKey: ["thread"] });
    },
  });
}
