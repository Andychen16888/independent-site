import { bi } from "@/components/admin/bilingual"

export default function AdminAnalyticsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Analytics", "数据分析")}</h1>
        <p className="text-body text-sm mt-1">{bi("Store performance and insights.", "店铺表现与洞察。")}</p>
      </div>
      <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
        {bi("Analytics dashboard will be available once you start receiving traffic.", "有访问流量后将显示分析看板。")}
      </div>
    </div>
  )
}
