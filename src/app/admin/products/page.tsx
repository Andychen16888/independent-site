import { prisma } from "@/lib/db/prisma"
import { formatPrice } from "@/lib/utils/format"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function getProducts() {
  try {
    return { products: await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { images: { where: { isPrimary: true }, take: 1 } },
    }), error: null as string | null }
  } catch (error) {
    console.error("Failed to fetch products:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return { products: [], error: message }
  }
}

export default async function AdminProductsPage() {
  const { products, error } = await getProducts()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">Products</h1>
          <p className="text-body text-sm mt-1">Manage your product catalog. ({products.length} total)</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary text-xs">Add Product</Link>
      </div>

      {error && (
        <div className="bg-rosegold/10 border border-rosegold/30 p-4 mb-6 rounded text-sm text-rosegold">
          <strong>Database error:</strong> {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          {error
            ? "Unable to load products due to a database error. Check the message above and verify your database connection."
            : "No products yet. Click &ldquo;Add Product&rdquo; to get started."
          }
        </div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Product</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">SKU</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Price</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Stock</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-mist/50 hover:bg-ivory/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images[0] && (
                        <img src={product.images[0].url} alt="" className="w-10 h-10 object-cover" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[240px]">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone text-xs">{product.sku}</td>
                  <td className="px-4 py-3">
                    {product.originalPrice ? (
                      <span>
                        <span className="text-stone line-through mr-1 text-xs">{formatPrice(Number(product.originalPrice))}</span>
                        {formatPrice(Number(product.unitPrice))}
                      </span>
                    ) : (
                      formatPrice(Number(product.unitPrice))
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={product.stock > 0 ? "text-sage" : "text-rosegold"}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${
                      product.status === "ACTIVE" ? "bg-sage/10 text-sage" :
                      product.status === "DRAFT" ? "bg-stone/10 text-stone" :
                      "bg-rosegold/10 text-rosegold"
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="btn-outline text-[10px] px-3 py-1.5 inline-flex items-center gap-1"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
