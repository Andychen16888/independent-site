type ElementTag = "p" | "div" | "strong" | "em" | "u" | "s" | "sup" | "sub" | "span" | "li" | "ul" | "ol" | "br"

const BLOCK_TAGS = new Set([
  "P", "DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "MAIN", "ASIDE", "FIGURE",
  "FIGCAPTION", "ADDRESS", "BLOCKQUOTE", "PRE", "H1", "H2", "H3", "H4", "H5", "H6",
  "LI", "TD", "TH", "CENTER", "DD", "DT",
])

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "META", "LINK", "TITLE", "HEAD", "BASE", "XML", "IFRAME", "OBJECT",
  "EMBED", "NOSCRIPT", "TEMPLATE", "IMG", "PICT", "SOURCE", "TRACK", "AUDIO", "VIDEO",
  "CANVAS", "SVG", "MATH", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "FORM", "FIELDSET",
  "LEGEND", "MAP", "AREA", "COL", "COLGROUP", "OPTION", "OPTGROUP", "DATALIST", "OUTPUT",
  "PROGRESS", "METER", "DIALOG", "SLOT", "APPLET", "PARAM", "MARQUEE", "BLINK",
])

const ALIGNMENTS = ["left", "center", "right", "justify"]

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  A: new Set(["href", "title"]),
  OL: new Set(["start"]),
}

const ALLOWED_STYLE_PROPERTIES = new Set([
  "text-align", "font-size", "font-family", "color", "background-color",
])

const UNSAFE_STYLE_VALUE = /[<>]|javascript:|expression\(|url\(|@import/i
const UNSAFE_HREF = /^\s*(javascript|vbscript|data):/i

const INVISIBLE_CHARACTERS = /[\u200B\u200C\u200D\u2060\uFEFF]/g
const BLANK_SPACES = /[\u00A0\u2007\u202F]+/g
const MARKER_ONLY = /^[\s\u00A0\u2007\u202F\u00B7\u2022\u25CF\u25CB\u25AA\u2219\u006F\u00A7\-\u2013>]*$/
const BULLET_MARKER = /^[\s\u00B7\u2022\u2023\u25CF\u25CB\u25AA\u25E6\u2219\u006F\u00A7\-\u2013]+$/

const BOLD_TAGS = new Set(["B", "STRONG", "H1", "H2", "H3", "H4", "H5", "H6", "TH"])
const ITALIC_TAGS = new Set(["I", "EM", "CITE", "VAR", "DFN"])
const UNDERLINE_TAGS = new Set(["U", "INS"])
const STRIKE_TAGS = new Set(["S", "STRIKE", "DEL"])
const SUPERSCRIPT_TAGS = new Set(["SUP"])
const SUBSCRIPT_TAGS = new Set(["SUB"])

const BULLET_LINE = /^\s*([-*\u2022\u2023\u25CF\u25CB\u25AA\u25E6\u00B7\u2219+])\s+(.*)$/
const ORDERED_LINE = /^\s*(\d{1,3}|[a-zA-Z]|[ivxlcdmIVXLCDM]{1,6}|[\u2460-\u2473\u3251-\u325F])[.\)\u3001\:]\s+(.*)$/
const HEADING_LINE = /^(#{1,6})\s+(.*)$/

function createElement(tag: ElementTag): HTMLElement {
  return document.createElement(tag)
}

function isElement(node: Node | null | undefined): node is HTMLElement {
  return !!node && node.nodeType === 1
}

function isBlankText(node: Node | null | undefined): boolean {
  return !!node && node.nodeType === 3 && (node.textContent || "").trim() === ""
}

function parseOfficeList(element: Element): { listId: string; level: number } | null {
  const style = element.getAttribute("style") || ""
  const match = /mso-list\s*:\s*([A-Za-z0-9_-]+)\s+level(\d+)/i.exec(style)
  if (!match) return null
  return { listId: match[1].toLowerCase(), level: parseInt(match[2], 10) || 1 }
}

function isMeaningfulNode(node: Node): boolean {
  if (isBlankText(node)) return false
  if (node.nodeType === 8) return false
  if (isElement(node)) return parseOfficeList(node) === null
  return (node.textContent || "").trim() !== ""
}

function nextAnchorNode(element: Element): Node | null {
  let node: Node | null = element.nextSibling
  while (node) {
    if (isMeaningfulNode(node)) return node
    node = node.nextSibling
  }
  return null
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function readTextAlign(element: HTMLElement): string {
  const inline = (element.style?.textAlign || "").trim().toLowerCase()
  const attribute = (element.getAttribute("align") || "").trim().toLowerCase()
  const value = inline || attribute
  return ALIGNMENTS.includes(value) ? value : ""
}

function readColor(value: string): string {
  const color = (value || "").trim()
  if (!color || color === "transparent" || /^rgba\([^)]*,\s*0(\.0+)?\s*\)$/i.test(color)) return ""
  return color
}

function hasMeaningfulText(element: Element): boolean {
  return !MARKER_ONLY.test((element.textContent || "").replace(BLANK_SPACES, " "))
}

function isInsidePre(element: Element): boolean {
  let parent = element.parentElement
  while (parent) {
    if (parent.tagName === "PRE") return true
    parent = parent.parentElement
  }
  return false
}

function wrapChildren(
  element: HTMLElement,
  tag: "strong" | "em" | "u" | "s" | "sup" | "sub" | "span",
  style?: string
): void {
  if (!element.firstChild) return
  const wrapper = createElement(tag)
  if (style) wrapper.setAttribute("style", style)
  while (element.firstChild) wrapper.appendChild(element.firstChild)
  element.appendChild(wrapper)
}

function applyInlineFormatting(element: HTMLElement): void {
  const style = element.style
  if (!style || style.length === 0) return

  const weight = (style.fontWeight || "").trim().toLowerCase()
  const bold = weight === "bold" || weight === "bolder" || (/^\d{2,4}$/.test(weight) && parseInt(weight, 10) >= 600)
  const slant = (style.fontStyle || "").trim().toLowerCase()
  const italic = slant === "italic" || slant === "oblique"
  const decoration = `${style.textDecoration || ""} ${style.textDecorationLine || ""}`.toLowerCase()
  const underline = decoration.includes("underline")
  const strike = decoration.includes("line-through")
  const vertical = (style.verticalAlign || "").trim().toLowerCase()

  const fontSize = (style.fontSize || "").trim()
  const fontFamily = (style.fontFamily || "").trim()
  const color = readColor(style.color || "")
  const background = readColor(style.backgroundColor || "")

  if (bold && !BOLD_TAGS.has(element.tagName)) wrapChildren(element, "strong")
  if (italic && !ITALIC_TAGS.has(element.tagName)) wrapChildren(element, "em")
  if (underline && !UNDERLINE_TAGS.has(element.tagName)) wrapChildren(element, "u")
  if (strike && !STRIKE_TAGS.has(element.tagName)) wrapChildren(element, "s")
  if (vertical === "super" && !SUPERSCRIPT_TAGS.has(element.tagName)) wrapChildren(element, "sup")
  if (vertical === "sub" && !SUBSCRIPT_TAGS.has(element.tagName)) wrapChildren(element, "sub")

  const spanStyle = [
    fontSize ? `font-size:${fontSize}` : "",
    fontFamily ? `font-family:${fontFamily}` : "",
    color ? `color:${color}` : "",
    background ? `background-color:${background}` : "",
  ].filter(Boolean).join(";")
  if (spanStyle) wrapChildren(element, "span", spanStyle)

  if (bold) style.removeProperty("font-weight")
  if (italic) style.removeProperty("font-style")
  if (underline || strike) {
    style.removeProperty("text-decoration")
    style.removeProperty("text-decoration-line")
    style.removeProperty("text-decoration-style")
    style.removeProperty("text-decoration-color")
  }
  if (vertical) style.removeProperty("vertical-align")
  if (fontSize) style.removeProperty("font-size")
  if (fontFamily) style.removeProperty("font-family")
  if (color) style.removeProperty("color")
  if (background) style.removeProperty("background-color")
}

function unwrapElement(element: HTMLElement): void {
  const parent = element.parentNode
  if (!parent) return
  while (element.firstChild) parent.insertBefore(element.firstChild, element)
  parent.removeChild(element)
}

const FORMATTING_OFF = /^(normal|none|lighter|0|100|200|300|400|500)$/i

function isFormattingOff(value: string): boolean {
  return !!value && FORMATTING_OFF.test(value.trim())
}

function stripNeutralizedFormatting(element: HTMLElement): void {
  const weight = element.style.fontWeight || ""
  const slant = element.style.fontStyle || ""
  const decoration = `${element.style.textDecoration || ""} ${element.style.textDecorationLine || ""}`.trim()
  const tag = element.tagName

  if ((tag === "B" || tag === "STRONG") && isFormattingOff(weight)) return unwrapElement(element)
  if ((tag === "I" || tag === "EM") && isFormattingOff(slant)) return unwrapElement(element)
  if ((tag === "U" || tag === "INS") && isFormattingOff(decoration)) return unwrapElement(element)
  if ((tag === "S" || tag === "STRIKE" || tag === "DEL") && isFormattingOff(decoration)) return unwrapElement(element)
}

function collectTextNodes(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let current = walker.nextNode()
  while (current) {
    nodes.push(current as Text)
    current = walker.nextNode()
  }
  return nodes
}

function cleanTextNodes(root: HTMLElement): void {
  for (const node of collectTextNodes(root)) {
    if (!node.parentElement || isInsidePre(node.parentElement)) continue
    node.data = node.data.replace(INVISIBLE_CHARACTERS, "").replace(BLANK_SPACES, " ")
  }
}

function markNewlinesAsBreaks(root: HTMLElement): void {
  for (const node of collectTextNodes(root)) {
    const parent = node.parentElement
    if (!parent || !node.data.includes("\n") || isInsidePre(parent)) continue
    const fragment = document.createDocumentFragment()
    node.data.split("\n").forEach((part, index) => {
      if (index > 0) fragment.appendChild(createElement("br"))
      if (part) fragment.appendChild(document.createTextNode(part))
    })
    parent.replaceChild(fragment, node)
  }
}

function collectOfficeListTypes(root: HTMLElement): Map<string, "bullet" | "number"> {
  const types = new Map<string, "bullet" | "number">()
  const pattern = /@list\s+([A-Za-z0-9_-]+):level(\d+)\s*\{([^}]*)\}/gi
  for (const style of Array.from(root.querySelectorAll<HTMLElement>("style"))) {
    const text = style.textContent || ""
    let match = pattern.exec(text)
    while (match) {
      const key = `${match[1].toLowerCase()}:${match[2]}`
      const bullet = /mso-level-number-format\s*:\s*bullet/i.test(match[3] || "")
      if (bullet || !types.has(key)) types.set(key, bullet ? "bullet" : "number")
      match = pattern.exec(text)
    }
  }
  return types
}

function readOfficeListMarker(element: Element): string {
  for (const child of Array.from(element.querySelectorAll<HTMLElement>("*"))) {
    const style = (child.getAttribute("style") || "").toLowerCase()
    if (style.includes("mso-list")) return (child.textContent || "").trim()
  }
  return ""
}

interface ListRecord {
  parent: Node
  anchor: Node | null
  level: number
  ordered: boolean
  item: HTMLElement
}

function convertOfficeLists(root: HTMLElement, types: Map<string, "bullet" | "number">): void {
  const records: ListRecord[] = []

  for (const element of Array.from(root.querySelectorAll("p"))) {
    const info = parseOfficeList(element)
    if (!info || !element.parentNode) continue

    const declared = types.get(`${info.listId}:${info.level}`)
    const ordered = declared ? declared === "number" : !BULLET_MARKER.test(readOfficeListMarker(element))
    const anchor = nextAnchorNode(element)
    const parent = element.parentNode
    const align = readTextAlign(element)

    applyInlineFormatting(element)

    const item = createElement("li")
    while (element.firstChild) item.appendChild(element.firstChild)
    if (align) item.setAttribute("style", `text-align:${align}`)
    element.remove()

    records.push({ parent, anchor, level: info.level, ordered, item })
  }

  const groups: ListRecord[][] = []
  for (const record of records) {
    const current = groups[groups.length - 1]
    const last = current ? current[current.length - 1] : null
    if (current && last && last.parent === record.parent && last.anchor === record.anchor) current.push(record)
    else groups.push([record])
  }

  for (const group of groups) {
    const list = createElement(group[0].ordered ? "ol" : "ul")
    const stack: Array<{ element: HTMLElement; level: number }> = [
      { element: list, level: group[0].level },
    ]

    for (const record of group) {
      while (stack.length > 1 && stack[stack.length - 1].level >= record.level) stack.pop()
      let top = stack[stack.length - 1]
      if (top.level < record.level && top.element.lastElementChild) {
        const nested = createElement(record.ordered ? "ol" : "ul")
        const host = top.element.lastElementChild
        if (host) host.appendChild(nested)
        else top.element.appendChild(nested)
        stack.push({ element: nested, level: record.level })
        top = stack[stack.length - 1]
      }
      top.element.appendChild(record.item)
    }

    const { parent, anchor } = group[0]
    if (anchor && anchor.parentNode === parent) parent.insertBefore(list, anchor)
    else parent.appendChild(list)
  }
}

function removeNoise(root: HTMLElement): void {
  const comments: Comment[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT)
  let current = walker.nextNode()
  while (current) {
    comments.push(current as Comment)
    current = walker.nextNode()
  }
  for (const comment of comments) comment.parentNode?.removeChild(comment)

  for (const element of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    const tag = element.tagName
    if (tag.includes(":")) {
      element.remove()
      continue
    }
    if (SKIP_TAGS.has(tag)) {
      element.remove()
      continue
    }
    const style = (element.getAttribute("style") || "").toLowerCase()
    if (style.includes("mso-") && !hasMeaningfulText(element)) {
      element.remove()
      continue
    }
    if (/^mso/i.test((element.getAttribute("class") || "").trim()) && !hasMeaningfulText(element)) {
      element.remove()
      continue
    }
  }
}

function normalizeContainerTags(root: HTMLElement): void {
  for (const element of Array.from(root.querySelectorAll<HTMLElement>("center"))) {
    const paragraph = createElement("p")
    paragraph.setAttribute("style", `text-align:${readTextAlign(element) || "center"}`)
    while (element.firstChild) paragraph.appendChild(element.firstChild)
    element.replaceWith(paragraph)
  }
}

const UNSUPPORTED_BLOCK_SELECTOR = "div,section,article,header,footer,main,aside,figure,figcaption,address,dd,dt"

function normalizeUnsupportedBlocks(root: HTMLElement): void {
  for (const element of Array.from(root.querySelectorAll<HTMLElement>(UNSUPPORTED_BLOCK_SELECTOR))) {
    if (!element.parentNode) continue
    const paragraph = createElement("p")
    const align = readTextAlign(element)
    const kept = filterStyle(element.getAttribute("style") || "")
    const hasAlign = /(^|;)\s*text-align\s*:/.test(kept)
    const hasBlockChild = Array.from(element.children).some((child) => BLOCK_TAGS.has(child.tagName))
    if (!hasMeaningfulText(element) || hasBlockChild) {
      unwrapElement(element)
      continue
    }
    const merged = [kept, !hasAlign && align ? `text-align:${align}` : ""].filter(Boolean).join(";")
    if (merged) paragraph.setAttribute("style", merged)
    while (element.firstChild) paragraph.appendChild(element.firstChild)
    element.replaceWith(paragraph)
  }
}

function rawStyleValue(style: string, property: string): string {
  for (const part of style.split(";")) {
    const separator = part.indexOf(":")
    if (separator === -1) continue
    if (part.slice(0, separator).trim().toLowerCase() !== property) continue
    return part.slice(separator + 1).trim()
  }
  return ""
}

function normalizeHighlightStyles(root: HTMLElement): void {
  for (const element of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    const raw = element.getAttribute("style") || ""
    if (!raw) continue
    if (element.style.backgroundColor) continue
    const candidate =
      rawStyleValue(raw, "background-color") ||
      rawStyleValue(raw, "mso-highlight") ||
      rawStyleValue(raw, "mso-background") ||
      rawStyleValue(raw, "background")
    if (!readColor(candidate)) continue
    element.style.setProperty("background-color", candidate)
  }
}

function convertTables(root: HTMLElement): void {
  for (const table of Array.from(root.querySelectorAll("table")).reverse()) {
    const fragment = document.createDocumentFragment()
    for (const row of Array.from(table.querySelectorAll("tr"))) {
      const cells = Array.from(row.querySelectorAll("td,th")).map((cell) =>
        (cell.textContent || "").replace(/\s+/g, " ").trim()
      )
      while (cells.length && cells[cells.length - 1] === "") cells.pop()
      const line = cells.filter((cell) => cell !== "").join(" | ").trim()
      if (!line) continue
      const paragraph = createElement("p")
      if (fragment.childNodes.length === 0) {
        const heading = createElement("strong")
        heading.textContent = line
        paragraph.appendChild(heading)
      } else {
        paragraph.textContent = line
      }
      fragment.appendChild(paragraph)
    }
    if (!fragment.childNodes.length) {
      const fallback = (table.textContent || "").replace(/\s+/g, " ").trim()
      if (fallback) {
        const paragraph = createElement("p")
        paragraph.textContent = fallback
        fragment.appendChild(paragraph)
      }
    }
    table.replaceWith(fragment)
  }
}

function promoteToBlock(element: HTMLElement): HTMLElement {
  if (BLOCK_TAGS.has(element.tagName)) return element
  const paragraph = createElement("p")
  const style = element.getAttribute("style")
  if (style) paragraph.setAttribute("style", style)
  element.replaceWith(paragraph)
  while (element.firstChild) paragraph.appendChild(element.firstChild)
  return paragraph
}

function splitBlockAfter(block: HTMLElement, first: Node, last: Node): HTMLElement | null {
  const parent = block.parentNode
  if (!parent) return null

  const target = promoteToBlock(block)
  const clone = target.cloneNode(false) as HTMLElement
  const align = readTextAlign(target)
  if (align) clone.setAttribute("style", `text-align:${align}`)

  let node: Node | null = last.nextSibling
  while (node) {
    const next: Node | null = node.nextSibling
    clone.appendChild(node)
    node = next
  }
  if (!clone.hasChildNodes()) return null

  let cursor: Node | null = first
  while (cursor) {
    const next: Node | null = cursor.nextSibling
    cursor.parentNode?.removeChild(cursor)
    if (cursor === last) break
    cursor = next
  }

  parent.insertBefore(clone, target.nextSibling)
  return clone
}

function normalizeBreaksInBlock(block: HTMLElement, splitEveryBreak: boolean): HTMLElement | null {
  const nodes = Array.from(block.childNodes)
  let index = 0

  while (index < nodes.length) {
    const node = nodes[index]
    if (!isElement(node) || node.tagName !== "BR") {
      index += 1
      continue
    }

    let end = index
    while (end < nodes.length) {
      const candidate = nodes[end]
      if (isElement(candidate) && candidate.tagName === "BR") {
        end += 1
        continue
      }
      if (isBlankText(candidate)) {
        end += 1
        continue
      }
      break
    }

    const run = nodes.slice(index, end)
    const count = run.filter((item) => isElement(item) && item.tagName === "BR").length
    const hasBefore = nodes.slice(0, index).some(isMeaningfulNode)
    const hasAfter = nodes.slice(end).some(isMeaningfulNode)

    if (hasAfter && (splitEveryBreak || count >= 2)) {
      return splitBlockAfter(block, run[0], run[run.length - 1])
    }
    if (hasBefore && hasAfter) {
      index = end
      continue
    }

    for (const item of run) item.parentNode?.removeChild(item)
    index = end
  }

  return null
}

function ensureBlockHost(root: HTMLElement): HTMLElement {
  const loose = Array.from(root.childNodes).some((node) => node.nodeType === 3 && (node.textContent || "").trim() !== "")
  const breaks = Array.from(root.children).some((element) => element.tagName === "BR")
  if (!loose && !breaks) return root

  const host = createElement("div")
  while (root.firstChild) host.appendChild(root.firstChild)
  root.appendChild(host)
  return host
}

function expandBreakRuns(root: HTMLElement, splitEveryBreak: boolean): void {
  const host = ensureBlockHost(root)
  const queue: HTMLElement[] = []
  const seen = new Set<HTMLElement>()

  for (const br of Array.from(host.querySelectorAll("br"))) {
    const owner = br.parentElement
    if (owner && !seen.has(owner)) {
      seen.add(owner)
      queue.push(owner)
    }
  }

  for (let index = 0; index < queue.length; index += 1) {
    const block = queue[index]
    if (!block.isConnected) continue
    const created = normalizeBreaksInBlock(block, splitEveryBreak)
    if (created) queue.push(created)
  }
}

function filterStyle(value: string): string {
  const declarations: string[] = []
  for (const part of value.split(";")) {
    const separator = part.indexOf(":")
    if (separator === -1) continue
    const property = part.slice(0, separator).trim().toLowerCase()
    const raw = part.slice(separator + 1).trim()
    if (!ALLOWED_STYLE_PROPERTIES.has(property)) continue
    if (!raw || UNSAFE_STYLE_VALUE.test(raw)) continue
    if (property === "color" || property === "background-color") {
      if (!readColor(raw)) continue
    }
    declarations.push(`${property}:${raw}`)
  }
  return declarations.join(";")
}

function cleanAttributes(root: HTMLElement): void {
  for (const element of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    const allowed = ALLOWED_ATTRIBUTES[element.tagName]

    const align = readTextAlign(element)
    element.removeAttribute("align")
    if (align) element.style.textAlign = align

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()

      if (name === "style") {
        const filtered = filterStyle(attribute.value)
        if (filtered) element.setAttribute("style", filtered)
        else element.removeAttribute("style")
        continue
      }
      if (name === "href") {
        if (element.tagName === "A" && !UNSAFE_HREF.test(attribute.value)) continue
        element.removeAttribute("href")
        continue
      }
      if (allowed?.has(name)) continue
      element.removeAttribute(name)
    }
  }
}

function removeBareWrappers(root: HTMLElement): void {
  for (const element of Array.from(root.querySelectorAll<HTMLElement>("span,font"))) {
    if (element.attributes.length > 0) continue
    unwrapElement(element)
  }
}

function isEmptyBlock(element: HTMLElement): boolean {
  if (element.children.length > 0) return false
  return (element.textContent || "").trim() === ""
}

function trimEmptyEdgeBlocks(root: HTMLElement): void {
  const trim = (fromEnd: boolean) => {
    for (;;) {
      const children = Array.from(root.childNodes).filter((node) => !isBlankText(node))
      if (!children.length) return
      const edge = fromEnd ? children[children.length - 1] : children[0]
      if (!isElement(edge)) return
      if (!BLOCK_TAGS.has(edge.tagName) || edge.tagName === "LI") return
      if (!isEmptyBlock(edge)) return
      edge.remove()
    }
  }
  trim(false)
  trim(true)
}

function hasBlockStructure(root: HTMLElement): boolean {
  return !!root.querySelector("p,div,section,article,header,footer,blockquote,h1,h2,h3,h4,h5,h6,li,ul,ol,pre,table,tr,td,center,br")
}

function normalizeBody(body: HTMLElement, splitEveryBreak: boolean): string {
  const officeListTypes = collectOfficeListTypes(body)

  cleanTextNodes(body)
  convertOfficeLists(body, officeListTypes)
  removeNoise(body)
  normalizeContainerTags(body)
  normalizeUnsupportedBlocks(body)
  normalizeHighlightStyles(body)

  for (const element of Array.from(body.querySelectorAll<HTMLElement>("*"))) {
    stripNeutralizedFormatting(element)
  }

  for (const element of Array.from(body.querySelectorAll<HTMLElement>("*"))) {
    applyInlineFormatting(element)
  }

  convertTables(body)
  expandBreakRuns(body, splitEveryBreak)
  cleanAttributes(body)
  removeBareWrappers(body)
  trimEmptyEdgeBlocks(body)

  return body.innerHTML
}

export function normalizePastedHtml(html: string): string {
  if (!html || !html.trim()) return ""

  const body = new DOMParser().parseFromString(html, "text/html").body
  if (!body) return ""

  const looseText = hasBlockStructure(body) ? "" : body.textContent || ""
  if (looseText.includes("\n")) {
    markNewlinesAsBreaks(body)
    return normalizeBody(body, true)
  }

  return normalizeBody(body, false)
}

export function textToPastedHtml(text: string): string {
  if (!text) return ""

  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  const output: string[] = []
  const stack: Array<{ tag: "ul" | "ol"; level: number }> = []

  const closeListsTo = (level: number) => {
    while (stack.length && stack[stack.length - 1].level >= level) {
      const [closed] = stack.splice(stack.length - 1, 1)
      if (closed) output.push(`</${closed.tag}>`)
    }
  }

  const addListItem = (level: number, tag: "ul" | "ol") => {
    const current = stack[stack.length - 1]
    if (!current || current.tag !== tag || current.level !== level) {
      closeListsTo(level)
      const target = Math.min(level, stack.length + 1)
      while (stack.length < target) {
        output.push(`<${tag}>`)
        stack.push({ tag, level: stack.length + 1 })
      }
    }
    output.push("<li>")
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(BLANK_SPACES, " ").replace(/\s+$/, "")
    if (!line.trim()) continue

    const heading = HEADING_LINE.exec(line)
    if (heading) {
      closeListsTo(1)
      const depth = Math.min(6, heading[1].length)
      output.push(`<h${depth}>${escapeHtml(heading[2].trim())}</h${depth}>`)
      continue
    }

    const bullet = BULLET_LINE.exec(line)
    const ordered = bullet ? null : ORDERED_LINE.exec(line)
    if (bullet || ordered) {
      const match = (bullet || ordered) as RegExpExecArray
      const indent = (line.match(/^[ \t]*/)?.[0] || "").replace(/\t/g, "  ").length
      addListItem(Math.min(4, 1 + Math.floor(indent / 2)), bullet ? "ul" : "ol")
      output.push(escapeHtml(match[2].trim()))
      continue
    }

    closeListsTo(1)
    output.push(`<p>${escapeHtml(line.trim())}</p>`)
  }

  closeListsTo(1)
  return output.join("")
}
