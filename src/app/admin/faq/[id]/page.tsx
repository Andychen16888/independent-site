import FaqForm from "@/components/admin/FaqForm"

export const metadata = {
  title: "Edit FAQ",
}

export default async function AdminFaqEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FaqForm mode="edit" faqId={id} />
}