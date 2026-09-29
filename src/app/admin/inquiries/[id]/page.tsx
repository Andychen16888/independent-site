import { InquiryDetailView } from "@/components/admin/sales/InquiryDetail"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

export default async function AdminInquiryDetailPage({ params }: Params) {
  const { id } = await params
  return <InquiryDetailView id={id} />
}
