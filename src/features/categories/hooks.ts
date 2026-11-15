import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCategories } from "@/features/categories/api";
import { queryKeys } from "@/lib/query-keys";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
  });
}
