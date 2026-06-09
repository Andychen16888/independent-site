import { prisma } from "@/lib/db/prisma"
import { formatDateShort } from "@/lib/utils/format"
import DeleteNewsletterButton from "./DeleteNewsletterButton"

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">Newsletter Subscribers</h1>
          <p className="text-body text-sm mt-1">
            {subscribers.length} total, {activeCount} active
          </p>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">No subscribers yet.</div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Email</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Subscribed</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Actions</th>
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
                      {sub.isActive ? "Active" : "Unsubscribed"}
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
