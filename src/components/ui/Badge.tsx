"use client"

import { cn } from "@/lib/utils/cn"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "sale" | "new" | "best"
  className?: string
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-charcoal text-white",
    sale: "bg-rosegold text-white",
    new: "bg-sage text-white",
    best: "bg-gold text-white",
  }

  return (
    <span className={cn("inline-block px-3 py-1 text-xs tracking-wider uppercase font-light", variants[variant], className)}>
      {children}
    </span>
  )
}
