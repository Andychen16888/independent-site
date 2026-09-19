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
}

interface OrderDetailProps {
  orderId: string
}

export function OrderDetail({ orderId }: OrderDetailProps) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const t = useTranslations("orders")
  const locale = useLocale()

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then(setOrder)
      .catch((err) => {
        console.error(err)
        setOrder(null)
      })
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-mist rounded w-1/3" />
        <div className="h-32 bg-mist rounded" />
        <div className="h-64 bg-mist rounded" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="bg-cream p-12 text-center">
        <p className="text-body">{t("notFound")}</p>
        <Link href="/account/orders" className="btn-outline mt-4 inline-block text-xs">
          {t("backToOrders")}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-cream p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs text-stone tracking-wider uppercase mb-1">{t("orderNumber")}</p>
            <p className="font-serif text-lg">{order.orderNumber}</p>
          </div>
          <Badge variant={statusColors[order.status] || "default"}>
            {order.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-xs text-stone tracking-wider uppercase mb-1">{t("date")}</p>
            <p>{formatDate(order.createdAt, locale)}</p>
          </div>
          <div>
            <p className="text-xs text-stone tracking-wider uppercase mb-1">{t("payment")}</p>
            <p>{order.paymentStatus}</p>
          </div>
          <div>
            <p className="text-xs text-stone tracking-wider uppercase mb-1">{t("total")}</p>
            <p className="font-medium">{formatPrice(Number(order.total), undefined, locale)}</p>
          </div>
          <div>
            <p className="text-xs text-stone tracking-wider uppercase mb-1">{t("shipping")}</p>
            <p>{order.shippingMethod || t("standard")}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-serif text-lg mb-4">{t("items")}</h3>
        <div className="divide-y divide-mist border border-mist">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex gap-4 p-4">
              <div className="w-16 h-16 bg-mist flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.productId || ""}`} className="text-sm hover:text-stone">
                  {item.productName}
                </Link>
                <p className="text-xs text-stone mt-1">{t("qty", { qty: item.quantity })}</p>
              </div>
              <p className="text-sm">{formatPrice(Number(item.totalPrice), undefined, locale)}</p>
            </div>
          ))}
        </div>
      </div>

      {order.trackingNumber && (
        <div className="bg-cream p-6">
          <h3 className="font-serif text-base mb-4">{t("tracking")}</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-stone">{t("trackingNumber")}</span>
              <span className="font-mono">{order.trackingNumber}</span>
            </div>
            {order.trackingProvider && (
              <div className="flex justify-between">
                <span className="text-stone">{t("carrier")}</span>
                <span>{order.trackingProvider}</span>
              </div>
            )}
            {order.tracking?.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-stone tracking-wider uppercase">{t("trackingHistory")}</p>
                {order.tracking.map((event: any) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="w-2 h-2 mt-1.5 bg-sage rounded-full flex-shrink-0" />
                    <div>
                      <p className="text-sm">{event.status || event.message}</p>
                      <p className="text-xs text-stone">{event.location && `${event.location} — `}{formatDate(event.timestamp, locale)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Link href="/account/orders" className="btn-outline text-xs">
          {t("backToOrders")}
        </Link>
        {order.status === "DELIVERED" && (
          <Link
            href={`/products?order=${order.id}`}
            className="btn-outline text-xs"
          >
            {t("leaveReview")}
          </Link>
        )}
      </div>
    </div>
  )
}