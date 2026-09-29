import { Suspense } from "react"
import { QuotationList } from "@/components/admin/sales/QuotationList"

export const metadata = { title: "Quotations / 报价单" }
export const dynamic = "force-dynamic"

export default function AdminQuotationsPage() {
  return (
    <Suspense fallback={null}>
      <QuotationList />
    </Suspense>
  )
}
