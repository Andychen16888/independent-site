"use client"

import FooterManager from "@/components/admin/FooterManager"
import { bi } from "@/components/admin/bilingual"

export default function AdminFooterPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Footer", "页脚管理")}</h1>
        <p className="text-body text-sm mt-1">
          {bi("Edit the company description and address shown in the footer for every language.", "按语言编辑页脚显示的公司简介和地址。")}
        </p>
      </div>
      <FooterManager />
    </div>
  )
}
