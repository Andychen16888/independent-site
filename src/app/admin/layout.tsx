import type { Metadata } from "next"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { bi } from "@/components/admin/bilingual"
import { VisitorBeacon } from "@/components/tracking/VisitorBeacon"
import { getSetting } from "@/lib/settings/settings"

export async function generateMetadata(): Promise<Metadata> {
  const siteName = (await getSetting("site.name")) || "Commerce"
  return {
    // absolute：品牌名已拼在这里，避免被根布局的 title.template 再追加一次
    title: { absolute: `Admin | ${siteName}` },
    robots: "noindex, nofollow",
  }
}

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const siteName = (await getSetting("site.name")) || "Commerce"
  return (
    <div className="flex min-h-screen bg-ivory">
      {/* 管理员自己在后台的浏览也发埋点：服务端打成 isAdmin=true 的「写入心跳」，不进真人
          统计，但能让「埋点写入是否停滞」的判断在只有管理员用站点时也有真实信号。 */}
      <VisitorBeacon />
      <AdminSidebar siteName={siteName} />
      <div className="flex-1 ml-64">
        <header className="h-16 border-b border-mist bg-white flex items-center justify-end px-8 gap-4">
          <span className="text-xs text-stone">{bi("Admin", "管理")}</span>
          <span className="text-[10px] uppercase tracking-wider text-sage font-medium">{bi("Admin", "管理后台")}</span>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
