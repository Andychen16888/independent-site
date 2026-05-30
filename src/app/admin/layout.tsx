import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export const metadata: Metadata = {
  title: "Admin | Oriental Beauty",
  robots: "noindex, nofollow",
}

async function getSession() {
  try {
    const { getToken } = await import("next-auth/jwt")
    const token = await getToken({
      req: { cookies: await cookies() } as any,
      secret: process.env.NEXTAUTH_SECRET,
    })
    return token
  } catch (error) {
    console.error("Failed to verify admin session:", error)
    return null
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = await getSession()
  if (!token?.email) redirect("/auth/signin")
  if (token.role !== "ADMIN") redirect("/")

  return (
    <div className="flex min-h-screen bg-ivory">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <header className="h-16 border-b border-mist bg-white flex items-center justify-end px-8 gap-4">
          <span className="text-xs text-stone">{token.email as string}</span>
          <span className="text-[10px] uppercase tracking-wider text-sage font-medium">Admin</span>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
