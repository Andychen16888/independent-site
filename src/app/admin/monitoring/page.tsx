import { prisma } from "@/lib/db/prisma"
import { MonitoringRefresh } from "./MonitoringRefresh"
import {
  getSystemMetrics,
  formatBytes,
  formatUptime,
  type HealthStatus,
} from "@/lib/system/metrics"

export const dynamic = "force-dynamic"

const STATUS_TEXT: Record<HealthStatus, string> = {
  ok: "text-sage",
  warning: "text-gold",
  critical: "text-rosegold",
}

const STATUS_BAR: Record<HealthStatus, string> = {
  ok: "bg-sage",
  warning: "bg-gold",
  critical: "bg-rosegold",
}

const STATUS_DOT: Record<HealthStatus, string> = {
  ok: "bg-sage",
  warning: "bg-gold",
  critical: "bg-rosegold",
}

const STATUS_LABEL_EN: Record<HealthStatus, string> = {
  ok: "Running normally",
  warning: "High load",
  critical: "Needs attention",
}

const STATUS_LABEL_ZH: Record<HealthStatus, string> = {
  ok: "运行正常",
  warning: "负载偏高",
  critical: "需要关注",
}

function StatusBadge({ status }: { status: HealthStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_TEXT[status]}`}>
      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL_EN[status]} <span className="opacity-60">{STATUS_LABEL_ZH[status]}</span>
    </span>
  )
}

function GaugeCard({
  title,
  titleZh,
  percent,
  status,
  rows,
  footer,
}: {
  title: string
  titleZh: string
  percent: number
  status: HealthStatus
  rows: { label: string; labelZh: string; value: string }[]
  footer?: string
}) {
  return (
    <section className="bg-white border border-mist p-6 flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-serif text-base">
          {title} <span className="text-sm text-stone">{titleZh}</span>
        </h3>
        <StatusBadge status={status} />
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className={`text-4xl font-light tabular-nums ${STATUS_TEXT[status]}`}>{percent}%</span>
        <span className="text-xs text-stone mb-1.5">used 使用率</span>
      </div>

      <div className="mt-3 h-2 bg-mist/50 overflow-hidden rounded-sm">
        <div
          className={`h-full rounded-sm transition-all duration-500 ${STATUS_BAR[status]}`}
          style={{ width: `${Math.max(0, Math.min(percent, 100))}%` }}
        />
      </div>

      <div className="mt-5 space-y-3 text-sm flex-1">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <span className="text-stone">
              {row.label} <span className="opacity-60">{row.labelZh}</span>
            </span>
            <span className="font-medium text-right break-all">{row.value}</span>
          </div>
        ))}
      </div>

      {footer && <p className="mt-4 pt-4 border-t border-mist/60 text-xs text-stone break-all">{footer}</p>}
    </section>
  )
}

async function getDbStats() {
  try {
    const [dbVersion, tableCount, productCount, orderCount, userCount] = await Promise.all([
      prisma.$queryRaw<{ version: string }[]>`SELECT version() AS version`,
      prisma.$queryRaw<{ count: bigint }[]>`SELECT count(*) AS count FROM information_schema.tables WHERE table_schema = 'public'`,
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
    ])
    return {
      ok: true,
      version: dbVersion[0]?.version ?? "Unknown",
      tableCount: Number(tableCount[0]?.count ?? 0),
      products: productCount,
      orders: orderCount,
      users: userCount,
    } as const
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" } as const
  }
}

export default async function AdminMonitoringPage() {
  const [sys, db] = await Promise.all([getSystemMetrics(), getDbStats()])
  const collectedAt = new Date(sys.collectedAt)

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="heading-md">
            System Monitoring <span className="text-2xl md:text-3xl text-stone">系统监控</span>
          </h1>
          <p className="text-body text-sm mt-1">Server, process and database status at a glance. 服务器、应用与数据库状态一目了然。</p>
        </div>
        <MonitoringRefresh />
      </div>

      <div className="mb-8 bg-white border border-mist p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${STATUS_DOT[sys.status]}`} />
          <div>
            <p className={`font-medium ${STATUS_TEXT[sys.status]}`}>
              {STATUS_LABEL_EN[sys.status]} <span className="text-sm opacity-70">/ {STATUS_LABEL_ZH[sys.status]}</span>
            </p>
            <p className="text-xs text-stone">
              {sys.hostname} · {sys.platform}
            </p>
          </div>
        </div>
        <p className="text-xs text-stone">
          Collected 采集时间：{collectedAt.toLocaleString("en-US", { hour12: false })}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <GaugeCard
          title="CPU"
          titleZh="处理器"
          percent={sys.cpu.percent}
          status={sys.cpu.status}
          rows={[
            { label: "Cores", labelZh: "核心数", value: `${sys.cpu.cores}` },
            { label: "Load avg", labelZh: "负载", value: sys.cpu.loadAvg.map((v) => v.toFixed(2)).join(" / ") },
          ]}
          footer={sys.cpu.model}
        />

        <GaugeCard
          title="Memory"
          titleZh="内存"
          percent={sys.memory.percent}
          status={sys.memory.status}
          rows={[
            { label: "Used", labelZh: "已用", value: formatBytes(sys.memory.used) },
            { label: "Free", labelZh: "空闲", value: formatBytes(sys.memory.free) },
            { label: "Total", labelZh: "总量", value: formatBytes(sys.memory.total) },
          ]}
        />

        <GaugeCard
          title="Storage"
          titleZh="存储"
          percent={sys.storage.percent}
          status={sys.storage.status}
          rows={
            sys.storage.available
              ? [
                  { label: "Used", labelZh: "已用", value: formatBytes(sys.storage.used) },
                  { label: "Free", labelZh: "可用", value: formatBytes(sys.storage.free) },
                  { label: "Total", labelZh: "总量", value: formatBytes(sys.storage.total) },
                ]
              : [{ label: "Status", labelZh: "状态", value: "Unavailable 不可用" }]
          }
          footer={sys.storage.available ? sys.storage.path : undefined}
        />

        <GaugeCard
          title="Application"
          titleZh="应用程序"
          percent={sys.process.percent}
          status={sys.process.status}
          rows={[
            { label: "Node.js", labelZh: "运行时", value: sys.process.nodeVersion },
            { label: "Process RSS", labelZh: "内存", value: formatBytes(sys.process.memory) },
            { label: "Uptime", labelZh: "运行时长", value: formatUptime(sys.process.uptime) },
          ]}
          footer={`System uptime 系统运行：${formatUptime(sys.uptime)}`}
        />
      </div>

      <section className="mt-8 bg-white border border-mist p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-base">
            Database <span className="text-sm text-stone">数据库</span>
          </h3>
          <StatusBadge status={db.ok ? "ok" : "critical"} />
        </div>

        {db.ok ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-sm">
            {[
              { label: "Tables", labelZh: "数据表", value: db.tableCount },
              { label: "Products", labelZh: "产品", value: db.products },
              { label: "Orders", labelZh: "订单", value: db.orders },
              { label: "Users", labelZh: "用户", value: db.users },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-stone">
                  {item.label} <span className="opacity-60">{item.labelZh}</span>
                </p>
                <p className="text-2xl font-light tabular-nums mt-1">{item.value}</p>
              </div>
            ))}
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs text-stone">Version 版本</p>
              <p className="text-xs mt-1 break-all">{db.version}</p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-rosegold">
            <p className="font-medium mb-1">Database connection failed 数据库连接失败</p>
            <p className="text-xs break-all">{db.error}</p>
          </div>
        )}
      </section>
    </div>
  )
}
