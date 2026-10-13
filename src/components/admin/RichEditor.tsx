"use client"

import { useEffect, useRef } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { TextStyle, Color, BackgroundColor } from "@tiptap/extension-text-style"
import { FontFamily } from "@tiptap/extension-font-family"
import Placeholder from "@tiptap/extension-placeholder"
import { FontSize } from "./FontSizeExtension"
import { TextAlign } from "./TextAlignExtension"
import { PasteFormatting } from "./PasteFormattingExtension"
import { bi } from "@/components/admin/bilingual"

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

const TEXT_ALIGNMENTS = [
  { value: "left", label: "L" },
  { value: "center", label: "C" },
  { value: "right", label: "R" },
  { value: "justify", label: "J" },
]

const toolbarButton =
  "px-1.5 py-0.5 text-xs rounded text-charcoal hover:bg-mist/50"
const toolbarButtonActive = "bg-charcoal text-white"

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

function ColorSwatch({
  title,
  value,
  onChange,
}: {
  title: string
  value: string
  onChange: (color: string) => void
}) {
  return (
    <label
      title={title}
      className="relative flex items-center gap-1 px-1.5 py-0.5 text-xs rounded text-charcoal cursor-pointer hover:bg-mist/50"
    >
      <span
        aria-hidden
        className="w-3 h-3 rounded-sm border border-mist"
        style={{ backgroundColor: value }}
      />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </label>
  )
}

function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  const currentFontSize =
    editor.getAttributes("textStyle").fontSize || ""
  const currentFontFamily =
    editor.getAttributes("textStyle").fontFamily || ""
  const currentColor = editor.getAttributes("textStyle").color || "#111111"
  const currentHighlight = editor.getAttributes("textStyle").backgroundColor || "#fff3a3"

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
        <option value="">{bi("Size", "字号")}</option>
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
        <option value="">{bi("Font", "字体")}</option>
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
        className={`${toolbarButton} ${editor.isActive("bold") ? toolbarButtonActive : ""}`}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${toolbarButton} italic ${editor.isActive("italic") ? toolbarButtonActive : ""}`}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`${toolbarButton} underline ${editor.isActive("underline") ? toolbarButtonActive : ""}`}
      >
        U
      </button>

      <span className="w-px h-4 bg-mist mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${toolbarButton} ${editor.isActive("heading", { level: 1 }) ? toolbarButtonActive : ""}`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${toolbarButton} ${editor.isActive("heading", { level: 2 }) ? toolbarButtonActive : ""}`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${toolbarButton} ${editor.isActive("heading", { level: 3 }) ? toolbarButtonActive : ""}`}
      >
        H3
      </button>

      <span className="w-px h-4 bg-mist mx-1" />

      {TEXT_ALIGNMENTS.map((align) => (
        <button
          key={align.value}
          type="button"
          title={bi(`Align ${align.value}`, `对齐方式：${align.value}`)}
          onClick={() => editor.chain().focus().setTextAlign(align.value).run()}
          className={`${toolbarButton} ${editor.isActive({ textAlign: align.value }) ? toolbarButtonActive : ""}`}
        >
          {align.label}
        </button>
      ))}

      <span className="w-px h-4 bg-mist mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${toolbarButton} ${editor.isActive("bulletList") ? toolbarButtonActive : ""}`}
      >
        {bi("List", "列表")}
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${toolbarButton} ${editor.isActive("orderedList") ? toolbarButtonActive : ""}`}
      >
        1.
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${toolbarButton} ${editor.isActive("blockquote") ? toolbarButtonActive : ""}`}
      >
        &ldquo;
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={toolbarButton}
      >
        &mdash;
      </button>

      <span className="w-px h-4 bg-mist mx-1" />

      <ColorSwatch
        title={bi("Text color", "文字颜色")}
        value={currentColor}
        onChange={(color) => editor.chain().focus().setColor(color).run()}
      />
      <ColorSwatch
        title={bi("Highlight", "高亮颜色")}
        value={currentHighlight}
        onChange={(color) => editor.chain().focus().setBackgroundColor(color).run()}
      />
      <button
        type="button"
        title={bi("Clear colors", "清除颜色")}
        onClick={() => editor.chain().focus().unsetColor().unsetBackgroundColor().run()}
        className={toolbarButton}
      >
        &times;
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
      TextStyle,
      Color,
      BackgroundColor,
      FontFamily,
      FontSize,
      TextAlign,
      Placeholder.configure({ placeholder }),
      PasteFormatting,
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
          "rich-text prose prose-stone max-w-none focus:outline-none px-3 py-2 text-sm",
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
