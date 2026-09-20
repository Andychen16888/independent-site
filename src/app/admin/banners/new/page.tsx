import BannerForm from "@/components/admin/BannerForm"
import { bi } from "@/components/admin/bilingual"

export const metadata = {
  title: "New Banner",
}

export default function NewBannerPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("New Banner", "新建横幅")}</h1>
        <p className="text-body text-sm mt-1">{bi("Add a homepage banner. Order by sort order (ascending).", "添加首页横幅，按排序值从小到大显示。")}</p>
      </div>
      <BannerForm mode="new" />
    </div>
  )
}
