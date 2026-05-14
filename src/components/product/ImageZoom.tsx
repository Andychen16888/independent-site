"use client"

import { useState, useRef } from "react"

interface ImageZoomProps {
  src?: string
  alt?: string
  className?: string
}

export function ImageZoom({ src, alt = "", className = "" }: ImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPosition({ x, y })
  }

  if (!src) {
    return (
      <div className={`aspect-[4/5] bg-mist flex items-center justify-center text-stone/30 text-sm tracking-wider uppercase ${className}`}>
        Product Image
      </div>
    )
  }

  return (
    <div
      ref={imageRef}
      className={`relative aspect-[4/5] overflow-hidden cursor-crosshair group ${className}`}
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
      />
      {isZoomed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundPosition: `${position.x}% ${position.y}%`,
            backgroundSize: "200%",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
    </div>
  )
}
