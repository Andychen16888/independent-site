import FaqForm from "@/components/admin/FaqForm"

export const metadata = {
  title: "Edit FAQ / 编辑常见问题",
}

export default async function AdminFaqEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FaqForm mode="edit" faqId={id} />
}
