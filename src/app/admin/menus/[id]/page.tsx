"use client"

import { useParams } from "next/navigation"
import MenuForm from "@/components/admin/MenuForm"
import { bi } from "@/components/admin/bilingual"

export default function EditMenuItemPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Edit Menu Item", "编辑菜单项")}</h1>
        <p className="text-body text-sm mt-1">{bi("Update label, URL, hierarchy, and visibility.", "更新名称、链接、层级与可见性。")}</p>
      </div>
      <MenuForm mode="edit" menuId={id} />
    </div>
  )
}
