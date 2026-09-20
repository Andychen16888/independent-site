import FaqForm from "@/components/admin/FaqForm"

export const metadata = {
  title: "New FAQ / 新建常见问题",
}

export default function AdminFaqNewPage() {
  return <FaqForm mode="new" />
}
