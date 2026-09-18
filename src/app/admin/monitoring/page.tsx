import os from "os"
import { prisma } from "@/lib/db/prisma"
import { MonitoringRefresh } from "./MonitoringRefresh"

export const dynamic = "force-dynamic"

function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${units[i]}`
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

async function getSystemStats() {
  const memTotal = os.totalmem()
  const memFree = os.freemem()
  const memUsed = memTotal - memFree
  const load = os.loadavg()
  const cpus = os.cpus()
  const cpuModel = cpus.length ? cpus[0].model.trim() : "Unknown"

  return {
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    uptime: os.uptime(),
    loadAvg: load,
    cpuModel,
    cpuCores: cpus.length,
    memTotal,
    memUsed,
    memFree,
    memPercent: Math.round((memUsed / memTotal) * 100),
    nodeVersion: process.version,
    processUptime: process.uptime(),
    processMemory: process.memoryUsage().rss,
  }
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
  const [sys, db] = await Promise.all([getSystemStats(), getDbStats()])
  const collectedAt = new Date()

  const memRows = [
    { label: "Total Memory", value: formatBytes(sys.memTotal) },
    { label: "Used Memory", value: formatBytes(sys.memUsed) },
    { label: "Free Memory", value: formatBytes(sys.memFree) },
  ]

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="heading-md">System Monitoring</h1>
          <p className="text-body text-sm mt-1">Server, process and database status.</p>
        </div>
        <MonitoringRefresh />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-white border border-mist p-6">
          <h3 className="font-serif text-base mb-4">System</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-stone">Hostname</span>
              <span className="font-medium text-right">{sys.hostname}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone">Platform</span>
              <span className="font-medium text-right">{sys.platform}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone">System Uptime</span>
              <span className="font-medium text-right">{formatUptime(sys.uptime)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone">Load Average</span>
              <span className="font-medium text-right">
                {sys.loadAvg.map((v) => v.toFixed(2)).join(" / ")}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone">CPU</span>
              <span className="font-medium text-right">{sys.cpuCores} cores — {sys.cpuModel}</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-stone">Memory Usage</span>
              <span className="font-medium">{sys.memPercent}%</span>
            </div>
            <div className="h-2 bg-mist/50 overflow-hidden">
              <div
                className={`h-full transition-all ${sys.memPercent > 85 ? "bg-rosegold" : "bg-sage"}`}
                style={{ width: `${Math.min(sys.memPercent, 100)}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
              {memRows.map((row) => (
                <div key={row.label}>
                  <p className="text-stone">{row.label}</p>
                  <p className="font-medium mt-1">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white border border-mist p-6">
          <h3 className="font-serif text-base mb-4">Application</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-stone">Node.js</span>
              <span className="font-medium text-right">{sys.nodeVersion}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone">Process Uptime</span>
              <span className="font-medium text-right">{formatUptime(sys.processUptime)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone">Process Memory (RSS)</span>
              <span className="font-medium text-right">{formatBytes(sys.processMemory)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone">Collected At</span>
              <span className="font-medium text-right">
                {collectedAt.toLocaleString("en-US", { hour12: false })}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-mist/50 pt-6">
            <h3 className="font-serif text-base mb-4">Database</h3>
            {db.ok ? (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-stone">Status</span>
                  <span className="font-medium text-sage">Connected</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-stone">Tables</span>
                  <span className="font-medium text-right">{db.tableCount}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-stone">Products</span>
                  <span className="font-medium text-right">{db.products}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-stone">Orders</span>
                  <span className="font-medium text-right">{db.orders}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-stone">Users</span>
                  <span className="font-medium text-right">{db.users}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-stone">Version</span>
                  <span className="font-medium text-right">{db.version}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-rosegold">
                <p className="font-medium mb-1">Database connection failed</p>
                <p className="text-xs break-all">{db.error}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}