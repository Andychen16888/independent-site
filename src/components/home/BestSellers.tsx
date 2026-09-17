"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Container } from "@/components/ui/Container"

// Placeholder — will be replaced with real product fetching
const products = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  name: "LED Motion Sensor Night Light",
  price: 9.9,
  originalPrice: 14.5,
  image: null,
}))

export function BestSellers() {
  return (
    <section className="section-padding bg-ivory">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          <span className="text-caption mb-4 block">Top Picks</span>
          <h2>Best Sellers</h2>
          <p>Wholesale favorites that buyers reorder again and again</p>
        </motion.div>

        <div className="product-grid">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/products/${product.id}`} className="group block">
                <div className="aspect-[3/4] bg-mist mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/10 to-transparent" />
                  {product.originalPrice && (
                    <span className="absolute top-4 left-4 bg-rosegold text-white px-3 py-1 text-[10px] tracking-wider uppercase">
                      Sale
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-base group-hover:text-stone transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-stone line-through">${product.originalPrice}</span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/products" className="btn-outline">
            View All Products
          </Link>
        </div>
      </Container>
    </section>
  )
}
