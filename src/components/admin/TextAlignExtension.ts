import { Extension } from "@tiptap/core"

const TEXT_ALIGNMENTS = ["left", "center", "right", "justify"]

export type TextAlignOptions = {
  types: string[]
  alignments: string[]
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textAlign: {
      setTextAlign: (alignment: string) => ReturnType
      unsetTextAlign: () => ReturnType
    }
  }
}

export const TextAlign = Extension.create<TextAlignOptions>({
  name: "textAlign",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      alignments: TEXT_ALIGNMENTS,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element) => {
              const value = (element.style.textAlign || element.getAttribute("align") || "").trim().toLowerCase()
              return TEXT_ALIGNMENTS.includes(value) ? value : null
            },
            renderHTML: (attributes) => {
              if (!attributes.textAlign) return {}
              return { style: `text-align: ${attributes.textAlign}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setTextAlign:
        (alignment: string) =>
        ({ commands }) =>
          commands.updateAttributes("textAlign", { textAlign: alignment }),
      unsetTextAlign:
        () =>
        ({ commands }) =>
          commands.updateAttributes("textAlign", { textAlign: null }),
    }
  },
})
