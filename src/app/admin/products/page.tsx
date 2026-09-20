import ProductManager from "@/components/admin/ProductManager"

export const metadata = {
  title: "Products / 产品",
}

export default function AdminProductsPage() {
  return (
    <div>
      <ProductManager />
    </div>
  )
}
