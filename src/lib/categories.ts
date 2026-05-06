import { useQuery } from "@tanstack/react-query";
import { api, type CategoryPublicItem } from "@/lib/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api<{ items: CategoryPublicItem[] }>("/api/categories"),
  });
}

