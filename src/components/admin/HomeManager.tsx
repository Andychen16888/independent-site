"use client"

import { bi } from "@/components/admin/bilingual"
import SettingsForm from "@/components/admin/SettingsForm"
import BannerManager from "@/components/admin/BannerManager"

export default function HomeManager() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="heading-md">{bi("Home", "首页管理")}</h1>
        <p className="text-body text-sm mt-1">
          {bi("Manage the hero banners and all homepage content in one place.", "集中管理首页轮播图与首页各版块内容。")}
        </p>
      </div>

      <section>
        <div className="bg-white border border-mist p-6">
          <BannerManager />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-serif text-lg">{bi("Site Identity & Homepage Content", "站点信息与首页内容")}</h2>
          <p className="text-sm text-stone mt-1">
            {bi("Site name, logo, description, and the homepage sections.", "站点名称、LOGO、描述及首页各版块内容。")}
          </p>
        </div>
        <SettingsForm groups={["site", "content"]} />
      </section>
    </div>
  )
}