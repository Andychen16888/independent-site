import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { getServerAuthSession } from "@/lib/auth/get-server-session"

export const metadata: Metadata = {
  title: "Admin | Oriental Beauty",
  robots: "noindex, nofollow",
}

async function getSession() {
  try {
    return await getServerAuthSession()
  } catch (error) {
    console.error("Failed to get auth session:", error)
    return null
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.user) redirect("/auth/signin")
  if ((session.user as any).role !== "ADMIN") redirect("/")

  return (
    <div className="flex min-h-screen bg-ivory">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <header className="h-16 border-b border-mist bg-white flex items-center justify-end px-8 gap-4">
          <span className="text-xs text-stone">{session.user.email}</span>
          <span className="text-[10px] uppercase tracking-wider text-sage font-medium">Admin</span>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
