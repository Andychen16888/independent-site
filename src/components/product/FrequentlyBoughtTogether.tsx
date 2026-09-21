"use client"

import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/Button"
import { formatPrice } from "@/lib/utils/format"
import { useCartStore } from "@/stores/cart-store"
import { toast } from "react-hot-toast"

interface BundleItem {
  id: string
  name: string
  slug: string
  price: number
  image?: string
}

interface FrequentlyBoughtTogetherProps {
  mainProduct: { id: string; name: string; slug: string; unitPrice: number | null; currency?: string }
  bundleItems: BundleItem[]
}

export function FrequentlyBoughtTogether({ mainProduct, bundleItems }: FrequentlyBoughtTogetherProps) {
  const addItem = useCartStore((s) => s.addItem)
  const t = useTranslations("product.frequentlyBought")
  const locale = useLocale()
  const currency = mainProduct.currency || "USD"

  if (bundleItems.length === 0 || mainProduct.unitPrice == null) return null

  const allItems = [
    { ...mainProduct, price: Number(mainProduct.unitPrice), image: "" },
    ...bundleItems,
  ]
  const totalPrice = allItems.reduce((sum, item) => sum + item.price, 0)
  const savings = bundleItems.length > 0 ? bundleItems.reduce((sum, item) => sum + item.price, 0) * 0.15 : 0
  const bundlePrice = totalPrice - savings

  const handleAddAll = () => {
    allItems.forEach((item) => {
      addItem({
        id: `${item.id}-${Date.now()}`,
        productId: item.id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        image: item.image || "",
        quantity: 1,
        stock: 999,
      })
    })
    toast.success(t("addedAll"))
  }

  return (
    <div className="bg-cream p-6 md:p-8">
      <h3 className="font-serif text-lg mb-6">{t("title")}</h3>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        {allItems.map((item, index) => (
          <div key={item.id} className="flex items-center gap-4">
            <Link href={`/products/${item.slug}`} className="flex-shrink-0">
              <div className="w-20 h-20 bg-mist" />
            </Link>
            {index < allItems.length - 1 && (
              <span className="text-stone text-lg hidden md:block">+</span>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2 mb-6">
        {allItems.map((item) => (
          <label key={item.id} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 accent-charcoal"
            />
            <span>
              <Link href={`/products/${item.slug}`} className="hover:text-stone">
                {item.name}
              </Link>
            </span>
            <span className="ml-auto">{formatPrice(item.price, currency, locale)}</span>
          </label>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone">{t("bundlePrice")}</span>
          <span className="font-medium">{formatPrice(bundlePrice, currency, locale)}</span>
        </div>
        {savings > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-sage">{t("youSave")}</span>
            <span className="text-sage">{formatPrice(savings, currency, locale)}</span>
          </div>
        )}
        <Button onClick={handleAddAll} className="w-full">
          {t("addAll")} — {formatPrice(bundlePrice, currency, locale)}
        </Button>
      </div>
    </div>
  )
}