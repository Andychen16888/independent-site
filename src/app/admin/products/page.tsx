export default function AdminProductsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">Products</h1>
          <p className="text-body text-sm mt-1">Manage your product catalog.</p>
        </div>
        <button className="btn-primary text-xs">Add Product</button>
      </div>

      <div className="bg-white border border-mist">
        <div className="p-12 text-center text-sm text-stone">
          No products yet. Click &ldquo;Add Product&rdquo; to get started.
        </div>
      </div>
    </div>
  )
}
