"use client"

import { useEffect, useState } from "react"
import { bi } from "@/components/admin/bilingual"

interface CategoryOption {
  slug: string
  name: string
}

/**
 * Well-known storefront destinations. Keeping these as friendly labels lets
 * admins pick a link without needing to know the raw URL path.
 */
export const STATIC_LINKS: { value: string; label: string }[] = [
  { value: "/", label: bi("Home", "首页") },
  { value: "/products", label: bi("All Products", "全部产品") },
  { value: "/blog", label: bi("Blog", "博客") },
  { value: "/faq", label: bi("FAQ", "常见问题") },
  { value: "/pages/about", label: bi("About Us", "关于我们") },
  { value: "/pages/contact", label: bi("Contact Us", "联系我们") },
  { value: "/pages/shipping", label: bi("Shipping & Returns", "配送与退换") },
  { value: "/pages/privacy", label: bi("Privacy Policy", "隐私政策") },
  { value: "/pages/terms", label: bi("Terms of Service", "服务条款") },
]

const INPUT_CLS =
  "w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"

const EXTERNAL_VALUE = "__external__"

function isExternalUrl(v: string): boolean {
  return /^https?:\/\//i.test(v)
}

function categoryHref(slug: string): string {
  return `/categories/${slug}`
}

export interface LinkSelectProps {
  value: string
  onChange: (v: string) => void
  /**
   * When true, an extra dropdown entry lets admins type an external URL
   * (http/https) manually instead of picking a storefront page.
   */
  allowExternal?: boolean
}

export default function LinkSelect({ value, onChange, allowExternal = false }: LinkSelectProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([])

  useEffect(() => {
    let alive = true
    fetch("/api/admin/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return
        if (Array.isArray(data?.categories)) {
          setCategories(data.categories.map((c: { slug?: string; name?: string }) => ({
            slug: c.slug || "",
            name: c.name || "",
          })))
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const externalMode = allowExternal && isExternalUrl(value)
  const selectValue = externalMode ? EXTERNAL_VALUE : value

  return (
    <div className="space-y-2">
      <select
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === EXTERNAL_VALUE) {
            if (!externalMode) onChange("")
            return
          }
          onChange(e.target.value)
        }}
        className={INPUT_CLS}
      >
        <option value="">{bi("Select a link", "请选择链接")}</option>
        {STATIC_LINKS.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
        {categories.filter((c) => c.slug).length > 0 && (
          <optgroup label={bi("Categories", "分类")}>
            {categories
              .filter((c) => c.slug)
              .map((c) => (
                <option key={c.slug} value={categoryHref(c.slug)}>
                  {c.name} — {bi("Category", "分类")}
                </option>
              ))}
          </optgroup>
        )}
        {allowExternal && (
          <option value={EXTERNAL_VALUE}>{bi("External link (enter URL below)", "外部链接（在下方输入网址）")}</option>
        )}
        {!allowExternal &&
          value &&
          !isExternalUrl(value) &&
          !STATIC_LINKS.some((l) => l.value === value) &&
          !categories.some((c) => c.slug && categoryHref(c.slug) === value) && (
            <option value={value}>{bi("Custom link (keep current)", "自定义链接（保留当前）")} — {value}</option>
          )}
      </select>
      {externalMode && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/..."
          className={INPUT_CLS}
        />
      )}
    </div>
  )
}