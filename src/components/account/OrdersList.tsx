"use client"

import { useState, useEffect } from "react"
import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { formatPrice, formatDate } from "@/lib/utils/format"
import { Badge } from "@/components/ui/Badge"

const statusColors: Record<string, "default" | "sale" | "new" | "best"> = {
  PENDING: "default",
  CONFIRMED: "new",
  PROCESSING: "new",
  SHIPPED: "best",
  DELIVERED: "best",
  CANCELLED: "sale",
  REFUNDED: "sale",
}

export function OrdersList() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations("orders")
  const locale = useLocale()

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`)
        return r.json()
      })
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err)
        setOrders([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-mist rounded" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-cream p-12 text-center">
        <p className="text-body text-sm">{t("noOrders")}</p>
        <Link href="/products" className="btn-outline mt-4 inline-block text-xs">
          {t("browseProducts")}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/account/orders/${order.id}`}
          className="block bg-cream p-6 hover:bg-mist transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium">{order.orderNumber}</p>
              <p className="text-xs text-stone mt-1">{formatDate(order.createdAt, locale)}</p>
            </div>
            <Badge variant={statusColors[order.status] || "default"}>
              {order.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone">
              {t("itemCount", { count: order.items?.length || 0 })}
            </span>
            <span className="font-medium">{formatPrice(Number(order.total), undefined, locale)}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}