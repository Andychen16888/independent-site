import { prisma } from "@/lib/db/prisma"
import { formatDateShort } from "@/lib/utils/format"
import { bi } from "@/components/admin/bilingual"
import { getCurrentUser } from "@/lib/auth/get-server-session"
import DeleteNewsletterButton from "./DeleteNewsletterButton"
import { NewsletterComposer } from "./NewsletterComposer"
import { NewsletterCampaignHistory } from "./NewsletterCampaignHistory"

export const dynamic = "force-dynamic"

async function getSubscribers() {
  try {
    return await prisma.newsletter.findMany({
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    console.error("Failed to fetch subscribers:", error)
    return []
  }
}

export default async function AdminNewsletterPage() {
  const subscribers = await getSubscribers()
  const activeCount = subscribers.filter((s) => s.isActive).length
  const currentUser = await getCurrentUser()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">{bi("Newsletter Subscribers", "邮件订阅用户")}</h1>
          <p className="text-body text-sm mt-1">
            {subscribers.length} {bi("total", "总计")}, {activeCount} {bi("active", "有效")}
          </p>
        </div>
      </div>

      <div className="mb-8 space-y-8">
        <NewsletterComposer activeCount={activeCount} adminEmail={currentUser?.email} />
      </div>

      <div className="mb-8">
        <NewsletterCampaignHistory />
      </div>

      {subscribers.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">{bi("No subscribers yet.", "暂无订阅用户。")}</div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Email", "邮箱")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Status", "状态")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Subscribed", "订阅时间")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Actions", "操作")}</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr key={sub.id} className="border-b border-mist/50 hover:bg-ivory/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{sub.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${
                      sub.isActive ? "bg-sage/10 text-sage" : "bg-stone/10 text-stone"
                    }`}>
                      {sub.isActive ? bi("Active", "有效") : bi("Unsubscribed", "已退订")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone">{formatDateShort(sub.createdAt)}</td>
                  <td className="px-4 py-3">
                    <DeleteNewsletterButton subscriberId={sub.id} email={sub.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
