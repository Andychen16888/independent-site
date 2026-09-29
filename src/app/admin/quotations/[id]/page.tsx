import { QuotationDetailView } from "@/components/admin/sales/QuotationDetail"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

export default async function AdminQuotationDetailPage({ params }: Params) {
  const { id } = await params
  return <QuotationDetailView id={id} />
}
