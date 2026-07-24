import sanitizeHtml from "sanitize-html";

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
] as const;

const ADMIN_EXTRA_TAGS = ["h2", "h3", "h4"] as const;

function linkTransform(tagName: string, attribs: sanitizeHtml.Attributes) {
  const href = attribs.href ?? "";
  if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
    delete attribs.href;
  }
  attribs.rel = "noopener noreferrer";
  attribs.target = "_blank";
  return { tagName, attribs };
}

function buildSanitizer(tags: readonly string[]) {
  return (dirty: string) =>
    sanitizeHtml(dirty, {
      allowedTags: [...tags],
      allowedAttributes: {
        a: ["href", "title", "target", "rel"],
      },
      allowedSchemes: ["http", "https", "mailto"],
      allowProtocolRelative: false,
      disallowedTagsMode: "discard",
      transformTags: {
        a: linkTransform,
      },
    }).trim();
}

export const sanitizeUserHtml = buildSanitizer(USER_ALLOWED_TAGS);
export const sanitizeAdminHtml = buildSanitizer([...USER_ALLOWED_TAGS, ...ADMIN_EXTRA_TAGS]);

/** Plain text for excerpts, meta descriptions, and length checks. */
export function stripHtmlToText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();
}

export function makePlainExcerpt(content: string, max = 160): string {
  const plain = stripHtmlToText(content);
  return plain.length > max ? `${plain.slice(0, max - 3)}...` : plain;
}
