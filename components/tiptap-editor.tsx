"use client";

import { useEffect, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// URL validation schema - accepts URLs with or without protocol
const urlSchema = z.string().transform((val) => {
  if (!val) return val;
  // If no protocol, add https://
  if (!/^https?:\/\//i.test(val)) {
    return `https://${val}`;
  }
  return val;
});
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  List,
  ListOrdered,
  Undo,
  Redo,
  Link as LinkIcon,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder,
}: TiptapEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || "Write something...",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[150px] p-3 text-xs [&_h1]:text-xl [&_h1]:font-normal [&_h1]:mt-0 [&_h1]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5",
      },
    },
  });

  // Sync editor content when content prop changes externally (e.g., from template or cleared)
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    // Clear if content is empty
    if (content === "" && currentContent !== "<p></p>") {
      editor.commands.clearContent();
    }
    // Set content if it changed externally (e.g., from template selection)
    else if (content && content !== currentContent) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      // Parse and normalize the URL (adds https:// if missing)
      const normalizedUrl = urlSchema.parse(linkUrl);
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: normalizedUrl })
        .run();
    }
    setLinkPopoverOpen(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkPopoverOpen(false);
    setLinkUrl("");
  }, [editor]);

  const insertMergeTag = useCallback(
    (tag: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(tag).run();
    },
    [editor]
  );

  const handleLinkPopoverOpen = (open: boolean) => {
    if (open && editor) {
      const previousUrl = editor.getAttributes("link").href;
      setLinkUrl(previousUrl || "");
    }
    setLinkPopoverOpen(open);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border overflow-hidden">
      <div className="border-b bg-muted/30 p-1 flex items-center gap-0.5">
        {/* Bold */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(editor.isActive("bold") && "bg-muted")}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        {/* Italic */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(editor.isActive("italic") && "bg-muted")}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        {/* Strikethrough */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(editor.isActive("strike") && "bg-muted")}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        {/* Link */}
        <Popover open={linkPopoverOpen} onOpenChange={handleLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className={cn(editor.isActive("link") && "bg-muted")}
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter a URL..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setLink();
                  }
                }}
                className="h-7 w-48 text-xs"
              />
              <Button
                type="button"
                size="sm"
                onClick={setLink}
                className="h-7 text-xs"
              >
                Link
              </Button>
              {editor.isActive("link") && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={removeLink}
                  className="h-7 text-xs"
                >
                  Unlink
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <div className="w-px h-4 bg-border mx-1" />
        {/* Heading */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={cn(editor.isActive("heading", { level: 1 }) && "bg-muted")}
        >
          <Heading1 className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        {/* Bullet List */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(editor.isActive("bulletList") && "bg-muted")}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        {/* Ordered List */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(editor.isActive("orderedList") && "bg-muted")}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        {/* Undo */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-3.5 w-3.5" />
        </Button>
        {/* Redo */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        {/* Merge Tags */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="gap-0.5 px-1.5 font-mono tracking-[-0.2em] text-xs text-muted-foreground"
            >
              {"{{}}"}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sender</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => insertMergeTag("{{ from.full_name }}")}
            >
              Full Name
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => insertMergeTag("{{ from.first_name }}")}
            >
              First Name
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => insertMergeTag("{{ from.last_name }}")}
            >
              Last Name
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Recipient</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => insertMergeTag("{{ to.full_name }}")}
            >
              Full Name
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => insertMergeTag("{{ to.first_name }}")}
            >
              First Name
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => insertMergeTag("{{ to.last_name }}")}
            >
              Last Name
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
