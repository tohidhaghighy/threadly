/** Shared Tailwind class strings for rich text display. */
export const richTextContentClasses =
  "rich-text-content text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:border-s-4 [&_blockquote]:border-border [&_blockquote]:ps-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pe-5 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pe-5";

export const richTextEditorShellClasses =
  "overflow-hidden rounded-lg border border-border/70 bg-background/70 shadow-sm";

export const richTextEditorToolbarClasses =
  "flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-muted/40 px-1.5 py-1";

export const richTextEditorContentClasses =
  "[&_.ProseMirror]:min-h-[inherit] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-right [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]";

export const richTextEditorProseClasses =
  "prose prose-sm max-w-none px-3 py-3 text-sm leading-relaxed focus:outline-none";

/** Default minimum editor body height */
export const richTextEditorDefaultMinHeight = "min-h-48";
