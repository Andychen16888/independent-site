"use client"

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/tiff"]
const MAX_SIZE = 5 * 1024 * 1024

function formatBytes(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

interface ImageInfo {
  width?: number
  height?: number
  bytes?: number
}

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
  const [originalBytes, setOriginalBytes] = useState<number | null>(null)
  const [info, setInfo] = useState<ImageInfo | null>(null)

  useEffect(() => {
    if (value) loadInfo(value)
    else setInfo(null)
  }, [value])

  function loadInfo(url: string) {
    const img = new Image()
    const imgData: ImageInfo = {}
    img.onload = () => {
      imgData.width = img.naturalWidth
      imgData.height = img.naturalHeight
      setInfo({ ...imgData })
    }
    img.onerror = () => setInfo(imgData.bytes ? { bytes: imgData.bytes } : null)
    img.src = url

    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        imgData.bytes = blob.size
        setInfo({ ...imgData })
      })
      .catch(() => {
        /* size unavailable — dimensions still reported by <img> onload */
      })
  }

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
    setOriginalBytes(file.size)
    setInfo(null)
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
      loadInfo(data.url)
      toast.success("Image uploaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const displayInfo =
    info?.bytes || info?.width
      ? [info?.bytes ? formatBytes(info.bytes) : null, info?.width && info?.height ? `${info.width} × ${info.height}` : null]
          .filter(Boolean)
          .join(" · ")
      : null

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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {value && (
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
          {uploading && originalBytes && (
            <div className="text-[11px] text-stone">
              Uploading {formatBytes(originalBytes)}…
            </div>
          )}
          {displayInfo && <div className="text-[11px] text-stone">{displayInfo}</div>}
        </div>
      )}
    </div>
  )
}