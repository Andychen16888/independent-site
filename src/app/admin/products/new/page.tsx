import ProductForm from "@/components/admin/ProductForm"

export const metadata = {
  title: "New Product",
}

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">New Product</h1>
        <p className="text-body text-sm mt-1">Add a new product to your catalog.</p>
      </div>
      <ProductForm mode="new" />
    </div>
  )
}