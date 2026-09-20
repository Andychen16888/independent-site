import FaqForm from "@/components/admin/FaqForm"

export const metadata = {
  title: "New FAQ",
}

export default function AdminFaqNewPage() {
  return <FaqForm mode="new" />
}