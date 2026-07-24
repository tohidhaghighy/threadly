import { api, type CategoryPublicItem } from "@/lib/api";

export function fetchCategories() {
  return api<{ items: CategoryPublicItem[] }>("/api/categories");
}
