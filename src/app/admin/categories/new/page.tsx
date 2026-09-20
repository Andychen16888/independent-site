import CategoryForm from "@/components/admin/CategoryForm"
import { bi } from "@/components/admin/bilingual"

export const metadata = {
  title: "New Category",
}

export default function NewCategoryPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("New Category", "新建分类")}</h1>
        <p className="text-body text-sm mt-1">{bi("Add a category for any product type — use Parent to build nested levels.", "为任意产品类型添加分类，可通过父级建立多层结构。")}</p>
      </div>
      <CategoryForm mode="new" />
    </div>
  )
}
