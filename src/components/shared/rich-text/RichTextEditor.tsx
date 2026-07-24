import { useEffect, type ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading2,
  Quote,
  Code2,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  richTextEditorContentClasses,
  richTextEditorDefaultMinHeight,
  richTextEditorProseClasses,
  richTextEditorShellClasses,
  richTextEditorToolbarClasses,
} from "@/styles/shared/rich-text";

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
  variant?: "user" | "admin";
  disabled?: boolean;
};

function promptForLink(current?: string | null) {
  const url = window.prompt("آدرس لینک (https://…)", current ?? "https://");
  if (url == null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed) && !/^mailto:/i.test(trimmed)) {
    window.alert("فقط لینک‌های http، https یا mailto مجاز هستند.");
    return null;
  }
  return trimmed;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "متن خود را اینجا بنویسید…",
  className,
  minHeightClassName = richTextEditorDefaultMinHeight,
  variant = "user",
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: variant === "admin" ? { levels: [2, 3] } : false,
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        protocols: ["http", "https", "mailto"],
        validate: (href) => /^https?:\/\//i.test(href) || /^mailto:/i.test(href),
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value || "",
    editable: !disabled,
    editorProps: {
      attributes: {
        class: cn(richTextEditorProseClasses, minHeightClassName),
        dir: "rtl",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? "" : ed.getHTML();
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = promptForLink(prev);
    if (url == null) return;
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const toolbarBtn = (active: boolean, onClick: () => void, icon: ReactNode, canRun = true) => (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="h-8 w-8"
      onClick={onClick}
      disabled={disabled || !canRun}
    >
      {icon}
    </Button>
  );

  return (
    <div className={cn(richTextEditorShellClasses, className)}>
      <div className={richTextEditorToolbarClasses}>
        {toolbarBtn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold className="h-4 w-4" />)}
        {toolbarBtn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic className="h-4 w-4" />)}
        {toolbarBtn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <List className="h-4 w-4" />)}
        {toolbarBtn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-4 w-4" />)}
        {toolbarBtn(editor.isActive("link"), setLink, <LinkIcon className="h-4 w-4" />)}
        {toolbarBtn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <Quote className="h-4 w-4" />)}
        {toolbarBtn(editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), <Code2 className="h-4 w-4" />)}
        {variant === "admin"
          ? toolbarBtn(
              editor.isActive("heading", { level: 2 }),
              () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
              <Heading2 className="h-4 w-4" />,
            )
          : null}
        <div className="ms-auto flex gap-0.5">
          {toolbarBtn(false, () => editor.chain().focus().undo().run(), <Undo2 className="h-4 w-4" />, editor.can().undo())}
          {toolbarBtn(false, () => editor.chain().focus().redo().run(), <Redo2 className="h-4 w-4" />, editor.can().redo())}
        </div>
      </div>
      <EditorContent editor={editor} className={cn(richTextEditorContentClasses, minHeightClassName)} />
    </div>
  );
}
