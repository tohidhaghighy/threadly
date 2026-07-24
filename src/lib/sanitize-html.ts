import DOMPurify from "dompurify";

const USER_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "code",
  "pre",
];

const ADMIN_EXTRA_TAGS = ["h2", "h3", "h4"];

function sanitize(dirty: string, allowHeadings: boolean) {
  if (typeof window === "undefined") return dirty;
  const tags = allowHeadings ? [...USER_ALLOWED_TAGS, ...ADMIN_EXTRA_TAGS] : USER_ALLOWED_TAGS;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: tags,
    ALLOWED_ATTR: ["href", "title", "target", "rel"],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target", "rel"],
  });
}

export function sanitizeUserHtml(html: string): string {
  return sanitize(html, false);
}

export function sanitizeAdminHtml(html: string): string {
  return sanitize(html, true);
}

export function stripHtmlToText(html: string): string {
  if (typeof window === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).replace(/\s+/g, " ").trim();
}

export function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}
