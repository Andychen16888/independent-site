import { Extension } from "@tiptap/core"
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model"
import { Plugin } from "@tiptap/pm/state"
import { normalizePastedHtml, textToPastedHtml } from "@/lib/editor/clipboard"

function buildPastedContent(html: string, text: string): string {
  if (html && html.trim()) {
    const normalized = normalizePastedHtml(html)
    if (normalized.trim()) return normalized
  }
  if (text && text.trim()) return textToPastedHtml(text)
  return ""
}

export const PasteFormatting = Extension.create({
  name: "pasteFormatting",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (view, event) => {
            const { state } = view
            if (state.selection.$from.parent.type.spec.code) return false

            const clipboard = event.clipboardData
            if (!clipboard) return false

            try {
              const html = clipboard.getData("text/html")
              const text = clipboard.getData("text/plain")
              const preferPlain = Boolean((event as unknown as { shiftKey?: boolean }).shiftKey)
              const content = preferPlain ? textToPastedHtml(text) : buildPastedContent(html, text)
              if (!content.trim()) return false

              const dom = new DOMParser().parseFromString(content, "text/html").body
              if (!dom) return false

              const slice = ProseMirrorDOMParser.fromSchema(state.schema).parseSlice(dom)
              if (!slice.size) return false

              view.dispatch(state.tr.replaceSelection(slice).scrollIntoView())
              view.focus()
              return true
            } catch {
              return false
            }
          },
        },
      }),
    ]
  },
})
