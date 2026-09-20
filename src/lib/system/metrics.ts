import os from "os"
import fs from "fs/promises"

export type HealthStatus = "ok" | "warning" | "critical"

export interface ResourceMetric {
  percent: number
  used: number
  total: number
  free: number
  status: HealthStatus
}

export interface SystemMetrics {
  hostname: string
  platform: string
  uptime: number
  collectedAt: string
  cpu: {
    model: string
    cores: number
    percent: number
    loadAvg: number[]
    status: HealthStatus
  }
  memory: ResourceMetric
  storage: {
    path: string
    available: boolean
    percent: number
    used: number
    total: number
    free: number
    status: HealthStatus
  }
  process: {
    nodeVersion: string
    uptime: number
    memory: number
    percent: number
    status: HealthStatus
  }
  status: HealthStatus
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${units[i]}`
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function statusFor(percent: number): HealthStatus {
  if (percent >= 90) return "critical"
  if (percent >= 75) return "warning"
  return "ok"
}

function statusRank(status: HealthStatus): number {
  return status === "critical" ? 2 : status === "warning" ? 1 : 0
}

function worst(...statuses: HealthStatus[]): HealthStatus {
  return statuses.reduce<HealthStatus>((acc, s) => (statusRank(s) > statusRank(acc) ? s : acc), "ok")
}

function cpuSnapshot() {
  let idle = 0
  let total = 0
  for (const cpu of os.cpus()) {
    const t = cpu.times
    idle += t.idle
    total += t.user + t.nice + t.sys + t.idle + t.irq
  }
  return { idle, total }
}

async function measureCpuPercent(): Promise<number> {
  const cores = Math.max(os.cpus().length, 1)
  const start = cpuSnapshot()
  await new Promise((resolve) => setTimeout(resolve, 200))
  const end = cpuSnapshot()
  const idleDelta = end.idle - start.idle
  const totalDelta = end.total - start.total
  if (totalDelta <= 0) {
    return Math.max(0, Math.min(100, Math.round((os.loadavg()[0] / cores) * 100)))
  }
  return Math.max(0, Math.min(100, Math.round(((totalDelta - idleDelta) / totalDelta) * 100)))
}

async function measureStorage() {
  const path = process.cwd()
  try {
    const stats = await fs.statfs(path)
    const total = stats.blocks * stats.bsize
    const free = stats.bavail * stats.bsize
    const used = Math.max(total - free, 0)
    const percent = total > 0 ? Math.round((used / total) * 100) : 0
    return { path, available: true, total, free, used, percent, status: statusFor(percent) }
  } catch {
    return {
      path,
      available: false,
      total: 0,
      free: 0,
      used: 0,
      percent: 0,
      status: "ok" as HealthStatus,
    }
  }
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
  const [cpuPercent, storage] = await Promise.all([measureCpuPercent(), measureStorage()])

  const cpus = os.cpus()
  const memTotal = os.totalmem()
  const memFree = os.freemem()
  const memUsed = Math.max(memTotal - memFree, 0)
  const memPercent = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0

  const processMemory = process.memoryUsage().rss
  const processPercent = memTotal > 0 ? Math.round((processMemory / memTotal) * 100) : 0

  const cpuStatus = statusFor(cpuPercent)
  const memStatus = statusFor(memPercent)
  const procStatus: HealthStatus = "ok"

  return {
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    uptime: os.uptime(),
    collectedAt: new Date().toISOString(),
    cpu: {
      model: cpus.length ? cpus[0].model.trim() : "Unknown",
      cores: cpus.length,
      percent: cpuPercent,
      loadAvg: os.loadavg(),
      status: cpuStatus,
    },
    memory: {
      percent: memPercent,
      used: memUsed,
      total: memTotal,
      free: memFree,
      status: memStatus,
    },
    storage,
    process: {
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: processMemory,
      percent: processPercent,
      status: procStatus,
    },
    status: worst(cpuStatus, memStatus, storage.status),
  }
}
