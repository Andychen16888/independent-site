import type { ReactNode } from "react"

export function bi(en: string, zh: string): string {
  return `${en} / ${zh}`
}

export function BiText({ en, zh }: { en: ReactNode; zh: ReactNode }) {
  return (
    <span>
      {en} <span className="opacity-70">/ {zh}</span>
    </span>
  )
}
