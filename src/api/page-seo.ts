import { api } from "@/lib/api";
import type { PageSeoItem } from "@/lib/page-seo";

export function fetchPageSeo(pageKey: string) {
  return api<PageSeoItem>(`/api/seo/pages/${pageKey}`);
}

export function fetchAllPageSeo() {
  return api<{ items: PageSeoItem[] }>("/api/seo/pages");
}

export function fetchAdminPageSeoList() {
  return api<{ items: PageSeoItem[] }>("/api/admin/seo/pages", { auth: true });
}

export type UpdatePageSeoPayload = {
  title?: string | null;
  titleAbsolute?: string | null;
  description: string;
  keywords: string[];
  noindex: boolean;
  footerBlurb?: string | null;
};

export function updateAdminPageSeo(pageKey: string, payload: UpdatePageSeoPayload) {
  return api<PageSeoItem>(`/api/admin/seo/pages/${pageKey}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}
