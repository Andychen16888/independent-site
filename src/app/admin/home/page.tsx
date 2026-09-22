import HomeManager from "@/components/admin/HomeManager"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Home / 首页管理",
}

export default function AdminHomePage() {
  return <HomeManager />
}