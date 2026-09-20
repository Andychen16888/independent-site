"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils/cn"

interface SmartImageProps {
  src: string | null | undefined
  alt: string
  /** Tailwind gradient classes shown while loading / when no photo exists. */
  tone?: string
  /** Cover the parent element (parent must be `relative`). Defaults to true. */
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  quality?: number
  /** Classes applied to the underlying image element. */
  className?: string
  /** Adds a navy gradient scrim on top of the image (for text legibility). */
  overlay?: boolean
  overlayClassName?: string
}

/**
 * Image wrapper around `next/image` that:
 *  - keeps a branded gradient placeholder under every image (no broken icons),
 *  - fades the photo in once loaded,
 *  - falls back to the gradient if the file is missing,
 *  - reserves layout via `fill` / explicit dimensions to avoid CLS.
 */
export function SmartImage({
  src,
  alt,
  tone = "from-navy-light via-navy to-ink",
  fill = true,
  width,
  height,
  sizes = "100vw",
  priority = false,
  quality = 82,
  className,
  overlay = false,
  overlayClassName,
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  const showImage = Boolean(src) && !errored

  const image = showImage ? (
    <Image
      src={src as string}
      alt={alt}
      {...(fill ? { fill: true } : { width: width ?? 1200, height: height ?? 800 })}
      sizes={sizes}
      priority={priority}
      quality={quality}
      onLoad={() => setLoaded(true)}
      onError={() => setErrored(true)}
      className={cn(
        "transition-opacity duration-700 ease-out",
        fill && "object-cover",
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  ) : null

  const layer = (
    <>
      <span aria-hidden className={cn("absolute inset-0 bg-gradient-to-br", tone)} />
      {image}
      {overlay && <span aria-hidden className={cn("img-overlay absolute inset-0", overlayClassName)} />}
    </>
  )

  if (fill) return layer

  return (
    <span className="relative block overflow-hidden">
      {layer}
    </span>
  )
}
