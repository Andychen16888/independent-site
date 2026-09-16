import MenuForm from "@/components/admin/MenuForm"

export const metadata = {
  title: "New Menu Item",
}

export default function NewMenuItemPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">New Menu Item</h1>
        <p className="text-body text-sm mt-1">Add a navigation item. Use Parent to create dropdowns.</p>
      </div>
      <MenuForm mode="new" />
    </div>
  )
}