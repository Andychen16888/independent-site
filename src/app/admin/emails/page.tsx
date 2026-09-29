import { Suspense } from "react"
import { EmailRecordList } from "@/components/admin/sales/EmailRecordList"

export const metadata = { title: "Email Records / 邮件记录" }
export const dynamic = "force-dynamic"

export default function AdminEmailsPage() {
  return (
    <Suspense fallback={null}>
      <EmailRecordList />
    </Suspense>
  )
}
