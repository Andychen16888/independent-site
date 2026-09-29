import { Suspense } from "react"
import { InquiryList } from "@/components/admin/sales/InquiryList"

export const metadata = { title: "Inquiries / 询盘" }
export const dynamic = "force-dynamic"

/**
 * `useSearchParams` needs a Suspense boundary, and Next requires a page reading
 * it to be dynamic, so the boundary is declared here rather than inside the list.
 */
export default function AdminInquiriesPage() {
  return (
    <Suspense fallback={null}>
      <InquiryList />
    </Suspense>
  )
}
