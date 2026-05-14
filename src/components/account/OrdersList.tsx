"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then(setOrders)
      .catch(console.error)
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
        <p className="text-body text-sm">No orders yet</p>
        <Link href="/products" className="btn-outline mt-4 inline-block text-xs">
          Browse Products
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
              <p className="text-xs text-stone mt-1">{formatDate(order.createdAt)}</p>
            </div>
            <Badge variant={statusColors[order.status] || "default"}>
              {order.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone">
              {order.items?.length || 0} item(s)
            </span>
            <span className="font-medium">{formatPrice(Number(order.total))}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
