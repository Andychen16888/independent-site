"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useCartStore } from "@/stores/cart-store"
import { CouponInput } from "./CouponInput"
import { formatPrice } from "@/lib/utils/format"
import { HiOutlineTrash, HiOutlineMinus, HiOutlinePlus, HiOutlineArrowLeft } from "react-icons/hi2"

export function CartContent() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore()
  const [discount, setDiscount] = useState(0)
  const t = useTranslations("cart")
  const locale = useLocale()

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-6 bg-mist rounded-full flex items-center justify-center">
          <HiOutlineTrash className="w-6 h-6 text-stone" />
        </div>
        <h2 className="heading-md mb-4">{t("emptyTitle")}</h2>
        <p className="text-body mb-8">{t("emptyMessage")}</p>
        <Link href="/products" className="btn-primary">
          {t("continueShopping")}
        </Link>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const shipping = subtotal >= 100 ? 0 : 12
  const total = Math.max(0, subtotal + shipping - discount)

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-12">
      <div className="space-y-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-6 pb-6 border-b border-mist"
          >
            <Link href={`/products/${item.slug}`} className="flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-mist" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/products/${item.slug}`}>
                <h3 className="font-serif text-base hover:text-stone transition-colors">
                  {item.name}
                </h3>
              </Link>
              <p className="text-sm text-stone mt-1">{formatPrice(item.price, undefined, locale)}</p>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center border border-charcoal/20">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="p-2 hover:bg-mist transition-colors"
                    aria-label={t("decreaseQuantity")}
                  >
                    <HiOutlineMinus className="w-3 h-3" />
                  </button>
                  <span className="px-3 text-sm min-w-[30px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="p-2 hover:bg-mist transition-colors"
                    aria-label={t("increaseQuantity")}
                  >
                    <HiOutlinePlus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {formatPrice(item.price * item.quantity, undefined, locale)}
                  </span>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-stone hover:text-charcoal transition-colors"
                    aria-label={t("removeItem")}
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-stone hover:text-charcoal transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          {t("continueShopping")}
        </Link>
      </div>

      <div className="lg:sticky lg:top-28 h-fit">
        <div className="bg-cream p-8 space-y-4">
          <h3 className="font-serif text-lg">{t("orderSummary")}</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-stone">{t("subtotal")}</span>
              <span>{formatPrice(subtotal, undefined, locale)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sage">
                <span>{t("discount")}</span>
                <span>-{formatPrice(discount, undefined, locale)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-stone">{t("shipping")}</span>
              <span>{shipping === 0 ? t("free") : formatPrice(shipping, undefined, locale)}</span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-stone">
                {t("freeShippingNote")}
              </p>
            )}

            <CouponInput subtotal={subtotal} onApplyDiscount={setDiscount} />

            <div className="border-t border-charcoal/10 pt-3 flex justify-between font-medium">
              <span>{t("total")}</span>
              <span>{formatPrice(total, undefined, locale)}</span>
            </div>
          </div>

          <Link href="/checkout" className="btn-primary w-full mt-6">
            {t("proceedToCheckout")}
          </Link>

          <div className="text-center text-xs text-stone">
            <p>{t("secureCheckout")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}