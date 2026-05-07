import { useEffect } from "react";

const SITE_NAME = "Threadly";
const DEFAULT_OG_IMAGE = "/og-default.svg";

function getEnvSiteUrl(): string | null {
  try {
    const v = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_PUBLIC_SITE_URL;
    return v && v.length ? v.replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

/** Resolve a base URL for canonical/og:url. Browser uses runtime origin; server falls back to env or empty. */
function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return getEnvSiteUrl() ?? "";
}

export type SeoInput = {
  /** Page title (will be appended with site name). Pass full title via `titleAbsolute` if you don't want " — Threadly". */
  title?: string;
  titleAbsolute?: string;
  description?: string;
  /** Path-only canonical (e.g. "/threads/abc"). The base URL is added automatically. */
  path?: string;
  image?: string;
  /** OG type, default "website" (use "article" for thread detail). */
  type?: "website" | "article" | "profile";
  /** Set to true to add `noindex,nofollow`. */
  noindex?: boolean;
  /** Optional ISO datetime for article:published_time. */
  publishedTime?: string;
  /** Optional ISO datetime for article:modified_time. */
  modifiedTime?: string;
  author?: string;
  /** Locale (e.g. "fa_IR"). */
  locale?: string;
  /** JSON-LD structured data object(s). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export type SeoTags = {
  meta: Array<{ title?: string; name?: string; property?: string; content?: string; charSet?: string }>;
  links: Array<{ rel: string; href: string }>;
  scripts?: Array<{ type: string; children: string }>;
};

/**
 * Build a consistent set of meta + link tags for `head:` in TanStack Start routes.
 * Use small static defaults for SSR; refine per-page via `useSeo` after data loads.
 */
export function buildSeo(input: SeoInput): SeoTags {
  const base = getBaseUrl();
  const fullTitle = input.titleAbsolute ?? (input.title ? `${input.title} — ${SITE_NAME}` : SITE_NAME);
  const description = input.description ?? "";
  const url = input.path ? `${base}${input.path}` : base || "";
  const image = input.image ?? DEFAULT_OG_IMAGE;
  const absImage = image.startsWith("http") ? image : `${base}${image}`;
  const type = input.type ?? "website";
  const locale = input.locale ?? "fa_IR";

  const meta: SeoTags["meta"] = [{ title: fullTitle }];

  if (description) meta.push({ name: "description", content: description });

  meta.push({
    name: "robots",
    content: input.noindex
      ? "noindex,nofollow"
      : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  });

  // OpenGraph
  meta.push({ property: "og:site_name", content: SITE_NAME });
  meta.push({ property: "og:type", content: type });
  meta.push({ property: "og:locale", content: locale });
  meta.push({ property: "og:title", content: fullTitle });
  if (description) meta.push({ property: "og:description", content: description });
  if (url) meta.push({ property: "og:url", content: url });
  if (absImage) meta.push({ property: "og:image", content: absImage });

  // Twitter
  meta.push({ name: "twitter:card", content: "summary_large_image" });
  meta.push({ name: "twitter:title", content: fullTitle });
  if (description) meta.push({ name: "twitter:description", content: description });
  if (absImage) meta.push({ name: "twitter:image", content: absImage });

  if (type === "article") {
    if (input.publishedTime) meta.push({ property: "article:published_time", content: input.publishedTime });
    if (input.modifiedTime) meta.push({ property: "article:modified_time", content: input.modifiedTime });
    if (input.author) meta.push({ property: "article:author", content: input.author });
  }

  const links: SeoTags["links"] = [];
  if (url) links.push({ rel: "canonical", href: url });

  const scripts: NonNullable<SeoTags["scripts"]> = [];
  if (input.jsonLd) {
    const arr = Array.isArray(input.jsonLd) ? input.jsonLd : [input.jsonLd];
    for (const item of arr) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify(item),
      });
    }
  }

  return { meta, links, scripts: scripts.length ? scripts : undefined };
}

/**
 * Client-side runtime SEO updater.
 * Updates document.title and key meta tags (description, og:*, twitter:*) and
 * `link[rel=canonical]` once data loads on a route. Useful for pages where the
 * primary SEO data is dynamic (e.g. thread title).
 */
export function useSeo(input: SeoInput | null | undefined) {
  useEffect(() => {
    if (typeof document === "undefined" || !input) return;
    const tags = buildSeo(input);

    // title
    const titleTag = tags.meta.find((m) => m.title);
    if (titleTag?.title) document.title = titleTag.title;

    // upsert meta tags
    const upsertMeta = (key: string, attr: "name" | "property", content?: string) => {
      if (!content) return;
      const selector = `meta[${attr}="${key}"]`;
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    for (const m of tags.meta) {
      if (m.title) continue;
      if (m.name) upsertMeta(m.name, "name", m.content);
      else if (m.property) upsertMeta(m.property, "property", m.content);
    }

    // canonical
    for (const l of tags.links) {
      if (l.rel !== "canonical") continue;
      let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!el) {
        el = document.createElement("link");
        el.rel = "canonical";
        document.head.appendChild(el);
      }
      el.href = l.href;
    }

    // JSON-LD: replace any previously injected one with the same data-seo attribute
    const prev = document.head.querySelectorAll('script[type="application/ld+json"][data-seo="route"]');
    prev.forEach((p) => p.parentNode?.removeChild(p));
    for (const s of tags.scripts ?? []) {
      const el = document.createElement("script");
      el.type = s.type;
      el.dataset.seo = "route";
      el.text = s.children;
      document.head.appendChild(el);
    }
  }, [input ? JSON.stringify(input) : null]);
}
