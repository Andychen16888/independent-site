"use client"

import Link from "next/link"
import SettingsForm from "@/components/admin/SettingsForm"
import { bi } from "@/components/admin/bilingual"

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="heading-md">{bi("Settings", "设置")}</h1>
          <p className="text-body text-sm mt-1">{bi("Configure store identity, contact, SEO, and shipping.", "配置店铺品牌、联系信息、SEO 和配送设置。")} {bi("Saved to the database and rendered on the storefront automatically.", "保存后会写入数据库并自动显示在前台。")}</p>
          <p className="text-body text-sm mt-2">
            <Link href="/admin/footer" className="underline hover:no-underline">
              {bi("Edit the footer company description and address by language", "按语言编辑页脚公司简介和地址")}
            </Link>
          </p>
        </div>
      </div>
      <SettingsForm />
    </div>
  )
}