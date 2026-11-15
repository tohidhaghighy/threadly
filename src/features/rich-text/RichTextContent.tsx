import { cn } from "@/lib/utils";
import { looksLikeHtml, sanitizeAdminHtml, sanitizeUserHtml, stripHtmlToText } from "@/features/rich-text/sanitize-html";
import { richTextContentClasses } from "@/features/rich-text/styles";

export type RichTextContentProps = {
  html: string;
  className?: string;
  variant?: "user" | "admin";
};

export function RichTextContent({ html, className, variant = "user" }: RichTextContentProps) {
  const trimmed = html?.trim() ?? "";
  if (!trimmed) return null;

  if (!looksLikeHtml(trimmed)) {
    return <p className={cn("whitespace-pre-wrap", className)}>{trimmed}</p>;
  }

  const safe = variant === "admin" ? sanitizeAdminHtml(trimmed) : sanitizeUserHtml(trimmed);
  if (!stripHtmlToText(safe)) return null;

  return (
    <div
      className={cn(richTextContentClasses, className)}
      dir="rtl"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
