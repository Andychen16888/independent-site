import type { Metadata } from "next"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export const metadata: Metadata = {
  title: "Admin | Oriental Beauty",
  robots: "noindex, nofollow",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-ivory">
      <AdminSidebar />
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
