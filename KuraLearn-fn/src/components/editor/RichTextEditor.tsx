import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  AlertCircle,
  Loader2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  RotateCcw,
  RotateCw,
  Trash2,
  Heading1,
  Heading2,
  Heading3,
  Type,
} from "lucide-react";
import DOMPurify from "dompurify";

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  minHeight?: string;
};

function MenuButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition ${
        isActive ? "bg-purple-100 text-[#6d3eeb]" : "text-slate-600 hover:bg-slate-100"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "ul",
      "ol",
      "li",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "a",
      "img",
      "br",
      "hr",
      "blockquote",
      "pre",
      "code",
      "span",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "style", "class"],
  });
}

function normalizeHtml(html: string): string {
  const cleaned = html.trim();
  if (cleaned === "" || cleaned === "<p></p>" || cleaned === "<p><br></p>") {
    return "";
  }
  return cleaned;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something amazing...",
  disabled = false,
  error,
  minHeight = "400px",
}: RichTextEditorProps) {
  const isInitializingRef = useRef(true);
  const lastOnChangeValueRef = useRef<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#6d3eeb] underline font-bold",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-xl shadow-md my-4 mx-auto block",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full border border-slate-200 my-4",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
    ],
    content: sanitizeHtml(value || ""),
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const normalizedHtml = normalizeHtml(html);
      if (normalizedHtml !== lastOnChangeValueRef.current) {
        lastOnChangeValueRef.current = normalizedHtml;
        const sanitized = sanitizeHtml(normalizedHtml);
        onChange(sanitized);
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-slate max-w-none px-5 py-4 focus:outline-none overflow-y-auto`,
        style: `min-height: ${minHeight};`,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (isInitializingRef.current) {
      const initialContent = sanitizeHtml(value || "");
      const sanitizedValue = normalizeHtml(initialContent);
      if (sanitizedValue) {
        editor.commands.setContent(sanitizedValue, false);
      }
      isInitializingRef.current = false;
      lastOnChangeValueRef.current = sanitizedValue;
      return;
    }

    const currentHtml = editor.getHTML();
    const normalizedCurrent = normalizeHtml(currentHtml);
    const normalizedValue = normalizeHtml(sanitizeHtml(value || ""));

    if (normalizedValue !== normalizedCurrent) {
      editor.commands.setContent(normalizedValue || "<p></p>", false);
      lastOnChangeValueRef.current = normalizedValue;
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  const handleAddLink = useCallback(() => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("Enter link URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const handleAddImage = useCallback(() => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleInsertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div
        className="rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center"
        style={{ minHeight }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col rounded-xl border border-slate-200 bg-white transition-all overflow-hidden ${error ? "border-red-300 ring-4 ring-red-50" : "focus-within:border-[#6d3eeb] focus-within:ring-4 focus-within:ring-purple-100"}`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/50 p-2 sm:p-2.5">
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <RotateCcw size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <RotateCw size={18} />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive("paragraph")}
            title="Paragraph"
          >
            <Type size={18} />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon size={18} />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <AlignLeft size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <AlignCenter size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <AlignRight size={18} />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1">
          <MenuButton onClick={handleAddLink} isActive={editor.isActive("link")} title="Add Link">
            <LinkIcon size={18} />
          </MenuButton>
          <MenuButton onClick={handleAddImage} title="Add Image">
            <ImageIcon size={18} />
          </MenuButton>
          <MenuButton onClick={handleInsertTable} title="Insert Table">
            <TableIcon size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            title="Clear Formatting"
          >
            <Trash2 size={18} className="text-red-600" />
          </MenuButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative overflow-hidden">
        <EditorContent editor={editor} style={{ minHeight }} />
      </div>

      {/* Footer / Error */}
      {error && (
        <div className="border-t border-red-100 bg-red-50/50 px-4 py-2">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-600">
            <AlertCircle size={14} />
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

export function RichTextViewer({ content }: { content?: string }) {
  if (!content) return null;
  return (
    <div
      className="prose prose-slate max-w-none text-slate-900"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
}

export default RichTextEditor;
