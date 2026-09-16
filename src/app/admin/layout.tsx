import type { Metadata } from "next"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { getSetting } from "@/lib/settings/settings"

export async function generateMetadata(): Promise<Metadata> {
  const siteName = (await getSetting("site.name")) || "Commerce"
  return {
    title: `Admin | ${siteName}`,
    robots: "noindex, nofollow",
  }
}

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const siteName = (await getSetting("site.name")) || "Commerce"
  return (
    <div className="flex min-h-screen bg-ivory">
      <AdminSidebar siteName={siteName} />
      <div className="flex-1 ml-64">
        <header className="h-16 border-b border-mist bg-white flex items-center justify-end px-8 gap-4">
          <span className="text-xs text-stone">Admin</span>
          <span className="text-[10px] uppercase tracking-wider text-sage font-medium">Admin</span>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
