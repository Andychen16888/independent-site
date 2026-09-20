import PageForm from "@/components/admin/PageForm"
import { bi } from "@/components/admin/bilingual"

export const metadata = {
  title: "New Page",
}

export default function NewPagePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("New Page", "新建页面")}</h1>
        <p className="text-body text-sm mt-1">{bi("Create a content page — visible at /pages/{slug}.", "创建内容页面，发布后路径为 /pages/{slug}。")}</p>
      </div>
      <PageForm mode="new" />
    </div>
  )
}
