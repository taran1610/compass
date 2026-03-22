"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { marked } from "marked";
import { cn } from "@/lib/utils";

type TipTapEditorProps = {
  content: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
};

function markdownToHtml(md: string): string {
  if (!md.trim()) return "<p></p>";
  try {
    return marked.parse(md) as string;
  } catch {
    return md;
  }
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
  className,
}: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: markdownToHtml(content),
    editable,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[200px] p-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      const html = markdownToHtml(content);
      if (html !== editor.getHTML()) {
        editor.commands.setContent(html, { emitUpdate: false });
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className={cn("animate-pulse rounded-md border bg-muted/30 p-4", className)}>
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-2 h-4 w-full rounded bg-muted" />
        <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
      </div>
    );
  }

  return (
    <EditorContent
      editor={editor}
      className={cn("rounded-md border bg-background", className)}
    />
  );
}
