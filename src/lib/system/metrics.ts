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

export interface ProcessMetric {
  pid: number
  name: string
  /** 该进程占整机 CPU 的百分比（已按核数归一，多核可超过 100）。 */
  cpuPercent: number
  memory: number
  memoryPercent: number
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
    /** 进程占整机内存的百分比（RSS / total），不是 CPU。 */
    memoryPercent: number
    /** 进程自身占用的整机 CPU 百分比（已按核数归一）。 */
    cpuPercent: number
    status: HealthStatus
  }
  /** 占用整机 CPU 最多的进程（Linux 下从 /proc 采集，其它平台为空数组）。 */
  topProcesses: ProcessMetric[]
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

function readCpuTimes(): { idle: number; total: number } {
  let idle = 0
  let total = 0
  for (const cpu of os.cpus()) {
    const t = cpu.times
    idle += t.idle
    // steal = hypervisor 被其它租户抢走的时间。VPS（如 Vultr）上这一项常常不小，
    // 漏算会让 total 偏小、busy 比例失真，所以必须计入。
    // @types/node 的 os.CpuInfo['times'] 未声明 steal（Linux 运行时才有，Windows 为 undefined），
    // 因此按索引安全取值。
    const steal = (t as { steal?: number }).steal ?? 0
    total += t.user + t.nice + t.sys + t.idle + t.irq + steal
  }
  return { idle, total }
}

function loadavgPercent(): number {
  const cores = Math.max(os.cpus().length, 1)
  // loadavg 反映的是「排队数」，超过核数说明有等待，不等于 CPU 已跑满，
  // 所以这里把单核等效上限按 cores 计算后夹到 100。
  return clampPercent((os.loadavg()[0] / cores) * 100)
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

// 滚动采样：用相邻两次读取的时间差算 CPU 占用，避免每次请求都 await 一个 sleep，
// 也避免 200ms 短窗口采到瞬时尖峰（部署残留负载）就报 100%。
// 首次调用（进程刚启动、还没有可比基线）才做一次 200ms 实测，之后全部走滚动窗口。
const MIN_WINDOW_MS = 2000
let prevTimes: { idle: number; total: number } | null = null
let prevAt = 0
let lastPercent = 0

function sampleCpuPercentSync(): number {
  const now = Date.now()
  const times = readCpuTimes()
  if (!prevTimes || now - prevAt < MIN_WINDOW_MS) {
    prevTimes = times
    prevAt = now
    return lastPercent
  }
  const idleDelta = times.idle - prevTimes.idle
  const totalDelta = times.total - prevTimes.total
  prevTimes = times
  prevAt = now
  lastPercent = totalDelta > 0 ? clampPercent(((totalDelta - idleDelta) / totalDelta) * 100) : loadavgPercent()
  return lastPercent
}

async function measureCpuPercent(): Promise<number> {
  if (prevTimes === null) {
    // 进程内仅执行一次：等一个短窗口拿到真实增量，避免首屏显示 loadavg 估算值。
    const start = readCpuTimes()
    await new Promise((resolve) => setTimeout(resolve, 200))
    const end = readCpuTimes()
    prevTimes = start
    prevAt = Date.now() - 200
    const idleDelta = end.idle - start.idle
    const totalDelta = end.total - start.total
    lastPercent = totalDelta > 0 ? clampPercent(((totalDelta - idleDelta) / totalDelta) * 100) : loadavgPercent()
    return lastPercent
  }
  return sampleCpuPercentSync()
}

// 进程自身 CPU 占用（之前监控里的 "Application %" 其实是内存占比，CPU 一直没被采集）。
// process.cpuUsage() 返回累计 user/system 微秒，与墙钟时间相比得到该进程吃掉的 CPU 比例。
type ProcCpuSample = { usage: NodeJS.CpuUsage; at: number }
let procCpuBaseline: ProcCpuSample | null = null

function measureProcessCpuPercent(): number {
  const cores = Math.max(os.cpus().length, 1)
  const now = Date.now()
  const usage = process.cpuUsage()
  if (!procCpuBaseline) {
    procCpuBaseline = { usage, at: now }
    return 0
  }
  const elapsedUs = (now - procCpuBaseline.at) * 1000
  const usedUs = usage.user - procCpuBaseline.usage.user + (usage.system - procCpuBaseline.usage.system)
  procCpuBaseline = { usage, at: now }
  if (elapsedUs <= 0 || usedUs <= 0) return 0
  return clampPercent(usedUs / elapsedUs / cores * 100)
}

// 进程级 CPU 归因：整机 100% 时，必须能指出「是谁在吃」。
// 之前监控只看整机百分比，定位不到元凶（实际是一个与本站无关的 dashboard 进程跑满双核）。
// Linux 下读 /proc：utime+stime 的时间差即为该进程消耗的 CPU 时间。
// 注意：这里不能用 clampPercent，%CPU 在多核机器上本就可以超过 100。
const CLK_TCK = 100
const PAGE_SIZE = 4096

interface ProcStatSample {
  ticks: number
  rss: number
  name: string
}

let procSamples: Map<number, ProcStatSample> | null = null
let procSamplesAt = 0

async function readProcSamples(): Promise<Map<number, ProcStatSample>> {
  const out = new Map<number, ProcStatSample>()
  let entries: string[]
  try {
    entries = await fs.readdir("/proc")
  } catch {
    return out
  }
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue
    const pid = Number(entry)
    try {
      const [stat, statm] = await Promise.all([
        fs.readFile(`/proc/${pid}/stat`, "utf8"),
        fs.readFile(`/proc/${pid}/statm`, "utf8"),
      ])
      // comm 字段（pid 与 state 之间）可能含空格与括号，所以从最后一个 ')' 之后再切。
      const open = stat.indexOf("(")
      const close = stat.lastIndexOf(")")
      if (open < 0 || close < 0) continue
      const name = stat.slice(open + 1, close)
      // 切掉 "pid (comm) " 之后：fields[0] 对应 stat 第 3 个字段 state，
      // 因此 utime(第 14) 在索引 11，stime(第 15) 在索引 12。
      const fields = stat.slice(close + 2).split(" ")
      const ticks = Number(fields[11]) + Number(fields[12])
      if (!Number.isFinite(ticks)) continue
      const rssPages = Number(statm.split(" ")[1])
      out.set(pid, {
        ticks,
        rss: (Number.isFinite(rssPages) ? rssPages : 0) * PAGE_SIZE,
        name,
      })
    } catch {
      // 进程已退出或无权限，忽略。
    }
  }
  return out
}

export async function getTopProcesses(limit = 8): Promise<ProcessMetric[]> {
  const cores = Math.max(os.cpus().length, 1)
  const memTotal = os.totalmem()
  let samples = await readProcSamples()

  if (procSamples === null) {
    // 进程内仅首次：等一个短窗口拿真实增量，让首屏就有归因数据。
    await new Promise((resolve) => setTimeout(resolve, 300))
    samples = await readProcSamples()
  }
  const now = Date.now()
  const prev = procSamples
  const prevAt = procSamplesAt
  procSamples = samples
  procSamplesAt = now
  if (!prev) return []

  const windowSec = (now - prevAt) / 1000
  if (windowSec <= 0) return []

  const rows: ProcessMetric[] = []
  for (const [pid, cur] of samples) {
    const before = prev.get(pid)
    if (!before) continue
    const deltaTicks = cur.ticks - before.ticks
    if (deltaTicks <= 0) continue
    const percent = Math.round((deltaTicks / CLK_TCK / windowSec / cores) * 100)
    if (percent <= 0) continue
    rows.push({
      pid,
      name: cur.name,
      cpuPercent: percent,
      memory: cur.rss,
      memoryPercent: memTotal > 0 ? Math.round((cur.rss / memTotal) * 100) : 0,
    })
  }
  rows.sort((a, b) => b.cpuPercent - a.cpuPercent)
  return rows.slice(0, limit)
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
  const [cpuPercent, storage, topProcesses] = await Promise.all([
    measureCpuPercent(),
    measureStorage(),
    getTopProcesses(),
  ])
  const processCpuPercent = measureProcessCpuPercent()

  const cpus = os.cpus()
  const memTotal = os.totalmem()
  const memFree = os.freemem()
  const memUsed = Math.max(memTotal - memFree, 0)
  const memPercent = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0

  const processMemory = process.memoryUsage().rss
  const processMemoryPercent = memTotal > 0 ? Math.round((processMemory / memTotal) * 100) : 0

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
      memoryPercent: processMemoryPercent,
      cpuPercent: processCpuPercent,
      status: procStatus,
    },
    topProcesses,
    status: worst(cpuStatus, memStatus, storage.status),
  }
}
