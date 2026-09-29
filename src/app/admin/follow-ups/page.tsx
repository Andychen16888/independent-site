import { Suspense } from "react"
import { FollowUpBoard } from "@/components/admin/sales/FollowUpBoard"

export const metadata = { title: "Follow-ups / 跟进" }
export const dynamic = "force-dynamic"

export default function AdminFollowUpsPage() {
  return (
    <Suspense fallback={null}>
      <FollowUpBoard />
    </Suspense>
  )
}
