import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAdminPageSeoList, fetchAllPageSeo, fetchPageSeo, updateAdminPageSeo } from "@/features/seo/api";
import type { UpdatePageSeoPayload } from "@/features/seo/api";
import { type SeoInput, useSeo } from "@/features/seo/seo";
import { pageSeoToInput } from "@/features/seo/page-seo";
import { queryKeys } from "@/lib/query-keys";

export function usePageSeo(pageKey: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.pageSeo(pageKey),
    queryFn: () => fetchPageSeo(pageKey),
    staleTime: 5 * 60 * 1000,
    enabled: (options?.enabled ?? true) && !!pageKey,
  });
}

export function useAllPageSeo() {
  return useQuery({
    queryKey: queryKeys.pageSeoAll,
    queryFn: fetchAllPageSeo,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStaticPageSeo(pageKey: string, fallback: SeoInput, extra?: Partial<SeoInput>) {
  const q = usePageSeo(pageKey);
  const input = useMemo(() => {
    if (q.data) return pageSeoToInput(q.data, extra);
    return { ...fallback, ...extra };
  }, [q.data, fallback, extra]);
  useSeo(input);
  return q;
}

export function useAdminPageSeoList(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminPageSeo,
    queryFn: fetchAdminPageSeoList,
    enabled,
  });
}

export function useUpdateAdminPageSeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pageKey, payload }: { pageKey: string; payload: UpdatePageSeoPayload }) =>
      updateAdminPageSeo(pageKey, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.adminPageSeo });
      await qc.invalidateQueries({ queryKey: ["pageSeo"] });
    },
  });
}
