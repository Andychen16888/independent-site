import { Suspense } from "react"
import { notFound } from "next/navigation"
import { InquiryList } from "@/components/admin/sales/InquiryList"
import { INQUIRY_STAGES } from "@/lib/sales/status-meta"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ stage: string }> }

/**
 * One route per sidebar pipeline stage, e.g. /admin/inquiries/stage/negotiation.
 *
 * The status is resolved from the static stage table rather than passed through as
 * a raw query value, so an unknown segment 404s instead of silently showing every
 * enquiry. The `stage/` prefix is what keeps this from colliding with the
 * /admin/inquiries/[id] detail route.
 */
export async function generateStaticParams() {
  return INQUIRY_STAGES.map((s) => ({ stage: s.key }))
}

export default async function AdminInquiryStagePage({ params }: Params) {
  const { stage } = await params
  const match = INQUIRY_STAGES.find((s) => s.key === stage)
  if (!match) notFound()

  return (
    <Suspense fallback={null}>
      <InquiryList lockedStatus={match.status} />
    </Suspense>
  )
}
