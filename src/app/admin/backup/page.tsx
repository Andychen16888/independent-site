"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import { fetchJsonResponse, readJsonResponse, responseErrorMessage } from "@/lib/json-response"

type Summary = {
  counts: Record<string, number>
  uploadDir: string
}

type RestoreResult = {
  mode: "merge" | "replace"
  tables: Record<string, number>
  filesRestored: number
  errors: string[]
}

const COUNT_LABELS: Array<{ key: string; label: string }> = [
  { key: "products", label: bi("Products", "产品") },
  { key: "categories", label: bi("Categories", "分类") },
  { key: "productImages", label: bi("Product images", "产品图片") },
  { key: "banners", label: bi("Banners", "横幅") },
  { key: "menus", label: bi("Menus", "菜单") },
  { key: "pages", label: bi("Pages", "页面") },
  { key: "blogPosts", label: bi("Blog posts", "博客") },
  { key: "siteFaqs", label: bi("FAQs", "常见问题") },
  { key: "siteSettings", label: bi("Settings", "设置") },
  { key: "files", label: bi("Uploaded files", "已上传文件") },
]

export default function AdminBackupPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [wipe, setWipe] = useState(false)
  const [result, setResult] = useState<RestoreResult | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  async function loadSummary() {
    try {
      const { parsed, data } = await fetchJsonResponse<any>("/api/admin/backup", { cache: "no-store" })
      const payload = (data || {}) as any
      if (!parsed.ok) throw new Error(responseErrorMessage(parsed, bi("Failed to load", "加载失败")))
      setSummary(payload)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Failed to load", "加载失败"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch("/api/admin/backup/export", { cache: "no-store" })
      if (!res.ok) {
        const parsed = await readJsonResponse(res)
        throw new Error(responseErrorMessage(parsed, bi("Export failed", "导出失败")))
      }

      const disposition = res.headers.get("Content-Disposition") || ""
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] || `backup-${Date.now()}.zip`

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      toast.success(bi("Backup downloaded", "备份已下载"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Export failed", "导出失败"))
    } finally {
      setExporting(false)
    }
  }

  async function handleRestore() {
    const file = fileInput.current?.files?.[0]
    if (!file) {
      toast.error(bi("Choose a backup file first", "请先选择备份文件"))
      return
    }

    setRestoring(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("wipe", wipe ? "true" : "false")

      const { parsed, data } = await fetchJsonResponse<any>("/api/admin/backup/restore", {
        method: "POST",
        body: formData,
      })
      const payload = (data || {}) as any
      if (!parsed.ok) throw new Error(responseErrorMessage(parsed, bi("Restore failed", "恢复失败")))

      setResult(payload.summary as RestoreResult)
      if (payload.summary?.errors?.length) {
        toast.error(bi("Restored with warnings", "恢复完成，但有警告"))
      } else {
        toast.success(bi("Restore complete", "恢复完成"))
      }
      await loadSummary()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Restore failed", "恢复失败"))
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Backup", "备份管理")}</h1>
        <p className="text-body text-sm mt-1">
          {bi(
            "Download a single archive of your catalog (categories, products and uploaded images) plus pages, blog, banners, menus and settings.",
            "可将站点内容（分类、产品、已上传图片，以及页面、博客、横幅、菜单和设置）打包为一个压缩包下载。",
          )}
          {bi(
            " After reinstalling the system, upload the archive here to restore everything.",
            "系统重装后，在此上传该压缩包即可一键恢复。",
          )}
        </p>
      </div>

      <div className="max-w-4xl space-y-8">
        <section className="bg-white border border-mist p-8 space-y-6">
          <div>
            <h2 className="font-serif text-lg mb-1">{bi("Current content", "当前内容")}</h2>
            <p className="text-[11px] text-stone break-all">
              {bi("Upload directory", "上传目录")}: {summary?.uploadDir || "—"}
            </p>
          </div>

          {loading ? (
            <div className="text-sm text-stone">{bi("Loading...", "正在加载...")}</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {COUNT_LABELS.map(({ key, label }) => (
                <div key={key} className="border border-mist p-4">
                  <div className="text-2xl font-light tabular-nums">
                    {summary?.counts?.[key] ?? 0}
                  </div>
                  <div className="text-[11px] text-stone mt-1">{label}</div>
                </div>
              ))}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center justify-center px-8 py-3 bg-charcoal text-white text-sm tracking-widest uppercase font-light transition-all duration-300 hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? bi("Preparing...", "正在打包...") : bi("Download Backup", "下载备份")}
            </button>
          </div>
        </section>

        <section className="bg-white border border-mist p-8 space-y-6">
          <div>
            <h2 className="font-serif text-lg">{bi("Restore from backup", "从此备份恢复")}</h2>
            <p className="text-body text-sm mt-1">
              {bi(
                "Select a .zip file previously downloaded from this page. Existing rows with the same ID (or the same slug/SKU/key) are updated; everything else is kept.",
                "选择之前从本页下载的 .zip 备份文件。相同 ID（或相同 slug/SKU/key）的记录会被更新，其余内容保留。",
              )}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <input
              ref={fileInput}
              type="file"
              accept=".zip,application/zip"
              className="block w-full text-sm text-charcoal file:mr-4 file:py-2 file:px-6 file:border file:border-mist file:bg-white file:text-sm file:tracking-widest file:uppercase file:font-light hover:file:bg-stone/5"
            />

            <label className="flex items-start gap-3 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={wipe}
                onChange={(e) => setWipe(e.target.checked)}
                className="mt-1"
              />
              <span>
                {bi(
                  "Replace mode: clear the current catalog (categories, products, pages, blog, banners, menus, FAQs, settings) before restoring.",
                  "覆盖模式：先清空当前目录数据（分类、产品、页面、博客、横幅、菜单、FAQ、设置）再恢复。",
                )}
                <span className="block text-[11px] text-rose-600 mt-0.5">
                  {bi(
                    "Irreversible. Leave unchecked to merge the backup into existing data.",
                    "不可撤销。不勾选则与现有数据合并。",
                  )}
                </span>
              </span>
            </label>

            <div>
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring}
                className="inline-flex items-center justify-center px-8 py-3 bg-charcoal text-white text-sm tracking-widest uppercase font-light transition-all duration-300 hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {restoring ? bi("Restoring...", "正在恢复...") : bi("Upload & Restore", "上传并恢复")}
              </button>
            </div>

            <p className="text-[11px] text-stone">
              {bi(
                "Maximum upload size is 50MB (nginx client_max_body_size). Increase it on the server for larger catalogs.",
                "单次上传上限为 50MB（nginx client_max_body_size）。数据较大时请在服务器上调高该值。",
              )}
            </p>
          </div>

          {result && (
            <div className="border-t border-mist pt-6 space-y-4">
              <div className="text-sm">
                {bi("Mode", "模式")}: <strong>{result.mode}</strong> ·{" "}
                {bi("Files restored", "恢复文件数")}: <strong>{result.filesRestored}</strong>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[12px]">
                {Object.entries(result.tables).map(([table, count]) => (
                  <div key={table} className="flex justify-between border border-mist px-3 py-1.5">
                    <span className="text-stone">{table}</span>
                    <span className="tabular-nums">{count}</span>
                  </div>
                ))}
              </div>

              {result.errors.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 p-4">
                  <div className="text-sm text-rose-700 font-medium mb-2">
                    {bi("Warnings", "警告")} ({result.errors.length})
                  </div>
                  <ul className="text-[11px] text-rose-700 space-y-1 max-h-48 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i} className="break-all">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
