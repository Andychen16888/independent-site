"use client"

import { useParams } from "next/navigation"
import MenuForm from "@/components/admin/MenuForm"

export default function EditMenuItemPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Edit Menu Item</h1>
        <p className="text-body text-sm mt-1">Update label, URL, hierarchy, and visibility.</p>
      </div>
      <MenuForm mode="edit" menuId={id} />
    </div>
  )
}