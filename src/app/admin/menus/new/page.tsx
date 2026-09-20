import MenuForm from "@/components/admin/MenuForm"
import { bi } from "@/components/admin/bilingual"

export const metadata = {
  title: "New Menu Item",
}

export default function NewMenuItemPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("New Menu Item", "新建菜单项")}</h1>
        <p className="text-body text-sm mt-1">{bi("Add a navigation item. Use Parent to create dropdowns.", "添加导航菜单项，可使用父级创建下拉层级。")}</p>
      </div>
      <MenuForm mode="new" />
    </div>
  )
}
