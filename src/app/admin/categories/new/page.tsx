import CategoryForm from "@/components/admin/CategoryForm"

export const metadata = {
  title: "New Category",
}

export default function NewCategoryPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">New Category</h1>
        <p className="text-body text-sm mt-1">Add a category for any product type — use Parent to build nested levels.</p>
      </div>
      <CategoryForm mode="new" />
    </div>
  )
}