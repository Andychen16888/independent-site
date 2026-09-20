import ProductForm from "@/components/admin/ProductForm"
import { bi } from "@/components/admin/bilingual"

export const metadata = {
  title: "New Product",
}

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("New Product", "新建产品")}</h1>
        <p className="text-body text-sm mt-1">{bi("Add a new product to your catalog.", "添加一个新产品到商品目录。")}</p>
      </div>
      <ProductForm mode="new" />
    </div>
  )
}
