import { type SeoInput } from "@/lib/seo";

export type PageSeoItem = {
  pageKey: string;
  label: string;
  path: string;
  title: string | null;
  titleAbsolute: string | null;
  description: string;
  keywords: string[];
  noindex: boolean;
  footerBlurb: string | null;
  updatedAt: string;
};

export const PAGE_SEO_KEYS = {
  home: "home",
  threads: "threads",
  users: "users",
  new: "new",
  login: "login",
  register: "register",
  settings: "settings",
  changePassword: "change-password",
} as const;

export type PageSeoKey = (typeof PAGE_SEO_KEYS)[keyof typeof PAGE_SEO_KEYS];

export function pageSeoToInput(page: PageSeoItem, extra?: Partial<SeoInput>): SeoInput {
  return {
    title: page.titleAbsolute ? undefined : (page.title ?? undefined),
    titleAbsolute: page.titleAbsolute ?? undefined,
    description: page.description,
    path: page.path,
    keywords: page.keywords,
    noindex: page.noindex,
    ...extra,
  };
}

export function parseKeywordsInput(raw: string): string[] {
  return raw
    .split(/[,،]/g)
    .map((k) => k.trim())
    .filter(Boolean);
}

export function pathnameToPageKey(pathname: string): string | null {
  if (pathname.startsWith("/admin")) return null;
  if (pathname === "/" || pathname === "") return PAGE_SEO_KEYS.home;
  if (pathname === "/threads" || pathname.startsWith("/threads/")) return PAGE_SEO_KEYS.threads;
  if (pathname === "/users" || pathname.startsWith("/users/")) return PAGE_SEO_KEYS.users;
  if (pathname === "/new") return PAGE_SEO_KEYS.new;
  if (pathname === "/login") return PAGE_SEO_KEYS.login;
  if (pathname === "/register") return PAGE_SEO_KEYS.register;
  if (pathname.startsWith("/settings")) return PAGE_SEO_KEYS.settings;
  if (pathname === "/change-password") return PAGE_SEO_KEYS.changePassword;
  return null;
}

export function formatKeywordsInput(keywords: string[]): string {
  return keywords.join("، ");
}

/** @deprecated Import from `@/hooks/api` instead. */
export { usePageSeo, useAllPageSeo, useStaticPageSeo } from "@/hooks/api/use-page-seo";
