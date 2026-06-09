"use client"

import { useEffect, useRef } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { TextStyle } from "@tiptap/extension-text-style"
import { FontFamily } from "@tiptap/extension-font-family"
import Placeholder from "@tiptap/extension-placeholder"
import { FontSize } from "./FontSizeExtension"

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px"]

const FONT_FAMILIES = [
  { label: "Default", value: "sans-serif" },
  { label: "Arial", value: "Arial" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: "'Times New Roman'" },
  { label: "Courier New", value: "'Courier New'" },
  { label: "Trebuchet MS", value: "'Trebuchet MS'" },
  { label: "Verdana", value: "Verdana" },
]

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  const currentFontSize =
    editor.getAttributes("textStyle").fontSize || ""
  const currentFontFamily =
    editor.getAttributes("textStyle").fontFamily || ""

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-mist bg-ivory/30">
      <select
        value={currentFontSize}
        onChange={(e) => {
          const val = e.target.value
          if (val) editor.chain().focus().setFontSize(val).run()
          else editor.chain().focus().unsetFontSize().run()
        }}
        className="text-xs border border-mist bg-white px-1 py-1 outline-none focus:border-charcoal"
      >
        <option value="">Size</option>
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <select
        value={currentFontFamily}
        onChange={(e) => {
          const val = e.target.value
          if (val) editor.chain().focus().setFontFamily(val).run()
        }}
        className="text-xs border border-mist bg-white px-1 py-1 outline-none focus:border-charcoal"
      >
        <option value="">Font</option>
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <span className="w-px h-4 bg-mist mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-1.5 py-0.5 text-xs rounded ${editor.isActive("bold") ? "bg-charcoal text-white" : "text-charcoal hover:bg-mist/50"}`}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-1.5 py-0.5 text-xs italic rounded ${editor.isActive("italic") ? "bg-charcoal text-white" : "text-charcoal hover:bg-mist/50"}`}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`px-1.5 py-0.5 text-xs underline rounded ${editor.isActive("underline") ? "bg-charcoal text-white" : "text-charcoal hover:bg-mist/50"}`}
      >
        U
      </button>

      <span className="w-px h-4 bg-mist mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-1.5 py-0.5 text-xs rounded ${editor.isActive("heading", { level: 1 }) ? "bg-charcoal text-white" : "text-charcoal hover:bg-mist/50"}`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-1.5 py-0.5 text-xs rounded ${editor.isActive("heading", { level: 2 }) ? "bg-charcoal text-white" : "text-charcoal hover:bg-mist/50"}`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-1.5 py-0.5 text-xs rounded ${editor.isActive("heading", { level: 3 }) ? "bg-charcoal text-white" : "text-charcoal hover:bg-mist/50"}`}
      >
        H3
      </button>

      <span className="w-px h-4 bg-mist mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-1.5 py-0.5 text-xs rounded ${editor.isActive("bulletList") ? "bg-charcoal text-white" : "text-charcoal hover:bg-mist/50"}`}
      >
        List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-1.5 py-0.5 text-xs rounded ${editor.isActive("orderedList") ? "bg-charcoal text-white" : "text-charcoal hover:bg-mist/50"}`}
      >
        1.
      </button>
    </div>
  )
}

export default function RichEditor({
  value,
  onChange,
  placeholder = "",
  minHeight = 150,
}: RichEditorProps) {
  const prevValueRef = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const cleaned = html === "<p></p>" ? "" : html
      prevValueRef.current = cleaned
      onChange(cleaned)
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-stone max-w-none focus:outline-none px-3 py-2 text-sm",
        style: `min-height: ${minHeight}px`,
      },
    },
  })

  useEffect(() => {
    if (editor && value !== prevValueRef.current) {
      prevValueRef.current = value
      editor.commands.setContent(value)
    }
  }, [editor, value])

  return (
    <div className="border border-mist bg-white overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
