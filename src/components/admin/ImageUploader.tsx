"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/tiff"]
const MAX_SIZE = 5 * 1024 * 1024

export default function ImageUploader({
  value,
  onChange,
  label = "Upload Image",
}: {
  value: string
  onChange: (url: string) => void
  label?: string
}) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File | undefined | null) {
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid image type")
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error("File too large (max 5MB)")
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      onChange(data.url)
      toast.success("Image uploaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <label className="inline-flex items-center justify-center px-4 py-2 border border-mist text-xs uppercase tracking-wider cursor-pointer hover:border-charcoal transition-colors">
        {uploading ? "Uploading..." : label}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ""
          }}
        />
      </label>
      {(value || uploading) && (
        <div className="flex items-center gap-2">
          {value && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-16 h-16 object-cover border border-mist" />
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[10px] uppercase tracking-wider text-rosegold hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
}