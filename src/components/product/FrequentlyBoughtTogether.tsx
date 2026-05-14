"use client"

import { useState } from "react"
import Link from "next/link"
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
  mainProduct: { id: string; name: string; slug: string; unitPrice: number }
  bundleItems: BundleItem[]
}

export function FrequentlyBoughtTogether({ mainProduct, bundleItems }: FrequentlyBoughtTogetherProps) {
  const addItem = useCartStore((s) => s.addItem)
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
    toast.success("Added all items to cart!")
  }

  if (bundleItems.length === 0) return null

  return (
    <div className="bg-cream p-6 md:p-8">
      <h3 className="font-serif text-lg mb-6">Frequently Bought Together</h3>

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
            <span className="ml-auto">{formatPrice(item.price)}</span>
          </label>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone">Bundle price:</span>
          <span className="font-medium">{formatPrice(bundlePrice)}</span>
        </div>
        {savings > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-sage">You save:</span>
            <span className="text-sage">{formatPrice(savings)}</span>
          </div>
        )}
        <Button onClick={handleAddAll} className="w-full">
          Add All to Cart — {formatPrice(bundlePrice)}
        </Button>
      </div>
    </div>
  )
}
