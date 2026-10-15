/**
 * 数据中心 / 云主机 / 爬虫网络的 IP 判定。
 *
 * 背景：UA 判定（bot.ts）只能拦住会自报家门的爬虫。但很多抓取器、链接预览服务、
 * AI scrapers 和监控探针会伪装成普通浏览器 UA（甚至直接复用 Chrome UA）却从云主机
 * 出网，于是被后台记成「访客」，制造大量只有 1 步的轨迹，把真人数据淹没。
 *
 * 真实访客几乎都来自住宅 / 企业 ISP，而不是 AWS / GCP / Azure / VPS 机房。这里用一份
 * 精选的 CIDR 清单识别「机房 IP」，与 UA 判定取并集一起写入 isBot 标记。
 *
 * 这是一份「宁缺毋滥」的清单：只收录明确属于云厂商 / 大型 VPS 的网段，尽量不误伤
 * 走企业出口或运营商出口的真人。内网 / 回环地址直接返回 false（它们本来就不该出现）。
 * 需要新增机房网段时，在下面两个数组里补一行 CIDR 即可。
 */

const DATACENTER_V4: readonly string[] = [
  // ---- Meta / Facebook (AS32934)：链接预览抓取的主力 ----
  "31.13.24.0/21",
  "31.13.64.0/18",
  "45.64.40.0/22",
  "66.220.144.0/20",
  "69.63.176.0/20",
  "69.171.224.0/19",
  "74.119.76.0/22",
  "103.4.96.0/22",
  "129.134.0.0/16",
  "157.240.0.0/16",
  "173.252.64.0/18",
  "179.60.192.0/22",
  "185.60.216.0/22",
  "204.15.20.0/22",

  // ---- Amazon AWS (AS16509) ----
  "3.0.0.0/8",
  "16.144.0.0/13",
  "16.192.0.0/13",
  "18.128.0.0/9",
  "44.192.0.0/10",
  "52.0.0.0/8",
  "54.0.0.0/8",

  // ---- Google Cloud (AS396982 / AS19527) ----
  "34.0.0.0/8",
  "35.0.0.0/8",

  // ---- Microsoft Azure (AS8075) ----
  "13.64.0.0/11",
  "20.0.0.0/8",
  "40.0.0.0/8",
  "104.40.0.0/13",

  // ---- DigitalOcean (AS14061) ----
  "45.55.0.0/16",
  "46.101.0.0/16",
  "64.227.0.0/16",
  "68.183.0.0/16",
  "104.131.0.0/16",
  "104.236.0.0/16",
  "134.209.0.0/16",
  "138.68.0.0/16",
  "138.197.0.0/16",
  "142.93.0.0/16",
  "143.198.0.0/16",
  "146.190.0.0/16",
  "157.230.0.0/16",
  "159.65.0.0/16",
  "159.89.0.0/16",
  "159.203.0.0/16",
  "161.35.0.0/16",
  "162.243.0.0/16",
  "164.90.0.0/16",
  "165.22.0.0/16",
  "167.71.0.0/16",
  "167.99.0.0/16",
  "174.138.0.0/16",
  "178.62.0.0/16",
  "188.166.0.0/16",
  "206.189.0.0/16",
  "209.97.0.0/16",

  // ---- Hetzner (AS24940) ----
  "5.9.0.0/16",
  "49.12.0.0/16",
  "65.108.0.0/16",
  "78.46.0.0/15",
  "88.99.0.0/16",
  "91.107.0.0/16",
  "95.216.0.0/16",
  "116.202.0.0/16",
  "135.181.0.0/16",
  "136.243.0.0/16",
  "138.201.0.0/16",
  "142.132.0.0/16",
  "144.76.0.0/16",
  "148.251.0.0/16",
  "157.90.0.0/16",
  "159.69.0.0/16",
  "162.55.0.0/16",
  "167.235.0.0/16",
  "168.119.0.0/16",
  "176.9.0.0/16",
  "178.63.0.0/16",
  "188.40.0.0/16",
  "195.201.0.0/16",
  "213.239.192.0/18",

  // ---- OVH (AS16276) ----
  "51.38.0.0/16",
  "51.68.0.0/16",
  "51.75.0.0/16",
  "51.83.0.0/16",
  "51.89.0.0/16",
  "51.91.0.0/16",
  "51.195.0.0/16",
  "51.210.0.0/16",
  "51.222.0.0/16",
  "51.254.0.0/16",
  "51.255.0.0/16",
  "54.36.0.0/16",
  "54.37.0.0/16",
  "54.38.0.0/16",
  "54.39.0.0/16",
  "92.222.0.0/16",
  "137.74.0.0/16",
  "141.94.0.0/16",
  "142.44.0.0/16",
  "144.217.0.0/16",
  "145.239.0.0/16",
  "147.135.0.0/16",
  "149.202.0.0/16",
  "151.80.0.0/16",
  "158.69.0.0/16",
  "164.132.0.0/16",
  "167.114.0.0/16",
  "178.32.0.0/15",
  "188.165.0.0/16",
  "192.99.0.0/16",
  "193.70.0.0/17",
  "213.32.0.0/18",

  // ---- Linode / Akamai (AS63949) ----
  "23.92.16.0/20",
  "23.239.0.0/19",
  "45.33.0.0/16",
  "45.56.0.0/16",
  "45.79.0.0/16",
  "50.116.0.0/16",
  "66.175.208.0/20",
  "69.164.192.0/19",
  "72.14.176.0/20",
  "74.207.224.0/19",
  "96.126.96.0/19",
  "97.107.128.0/19",
  "103.3.60.0/22",
  "139.144.0.0/16",
  "172.104.0.0/15",
  "172.105.0.0/16",
  "173.255.192.0/18",
  "192.155.80.0/20",
  "198.58.96.0/19",
  "198.74.48.0/20",

  // ---- Vultr / Constant (AS20473) ----
  "45.32.0.0/16",
  "45.63.0.0/16",
  "45.76.0.0/16",
  "45.77.0.0/16",
  "64.156.0.0/18",
  "66.42.0.0/16",
  "78.141.192.0/18",
  "95.179.128.0/17",
  "104.156.224.0/19",
  "108.61.0.0/16",
  "136.244.64.0/18",
  "140.82.0.0/16",
  "149.28.0.0/16",
  "155.138.128.0/17",
  "158.247.128.0/18",
  "167.179.64.0/18",
  "173.199.64.0/18",
  "198.13.32.0/19",
  "207.148.0.0/18",
  "209.250.240.0/20",
  "216.128.128.0/18",
]

const DATACENTER_V6: readonly string[] = [
  // ---- Meta / Facebook ----
  "2a03:2880::/31",
  "2620:0:1c00::/40",
  "2401:db00::/32",
  // ---- Amazon AWS ----
  "2600:1f00::/24",
  "2406:da00::/24",
  "2a05:d000::/24",
  // ---- Google Cloud ----
  "2600:1900::/28",
  // ---- Microsoft Azure ----
  "2603:1000::/20",
  // ---- DigitalOcean ----
  "2604:a880::/32",
  // ---- Hetzner ----
  "2a01:4f8::/32",
  "2a01:4f9::/32",
  // ---- OVH ----
  "2001:41d0::/32",
  "2607:5300::/32",
  // ---- Linode ----
  "2600:3c00::/32",
  // ---- Vultr ----
  "2001:19f0::/32",
]

interface CidrRange {
  base: bigint
  mask: bigint
  bits: number
}

function ipv4ToBigInt(ip: string): bigint | null {
  const parts = ip.split(".")
  if (parts.length !== 4) return null
  let value = BigInt(0)
  for (const part of parts) {
    const octet = Number(part)
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null
    value = (value << BigInt(8)) | BigInt(octet)
  }
  return value
}

function ipv6ToBigInt(input: string): bigint | null {
  let ip = input.trim().toLowerCase()
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1)
  const zone = ip.indexOf("%")
  if (zone !== -1) ip = ip.slice(0, zone)
  if (!ip.includes(":")) return null

  // 内嵌 IPv4（如 ::ffff:1.2.3.4），换成两段十六进制
  const lastColon = ip.lastIndexOf(":")
  const tail = ip.slice(lastColon + 1)
  if (tail.includes(".")) {
    const v4 = ipv4ToBigInt(tail)
    if (v4 === null) return null
    const hi = ((v4 >> BigInt(16)) & BigInt(0xffff)).toString(16)
    const lo = (v4 & BigInt(0xffff)).toString(16)
    ip = `${ip.slice(0, lastColon + 1)}${hi}:${lo}`
  }

  const doubleColon = ip.indexOf("::")
  let groups: string[]
  if (doubleColon !== -1) {
    if (ip.indexOf("::", doubleColon + 1) !== -1) return null
    const left = ip.slice(0, doubleColon)
    const right = ip.slice(doubleColon + 2)
    const leftGroups = left ? left.split(":") : []
    const rightGroups = right ? right.split(":") : []
    const missing = 8 - leftGroups.length - rightGroups.length
    if (missing < 1) return null
    groups = [...leftGroups, ...Array<string>(missing).fill("0"), ...rightGroups]
  } else {
    groups = ip.split(":")
  }
  if (groups.length !== 8) return null

  let value = BigInt(0)
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null
    value = (value << BigInt(16)) | BigInt(Number.parseInt(group, 16))
  }
  return value
}

function parseCidr(cidr: string): CidrRange | null {
  const [address, prefixText] = cidr.split("/")
  const isV6 = address.includes(":")
  const bits = isV6 ? 128 : 32
  const base = isV6 ? ipv6ToBigInt(address) : ipv4ToBigInt(address)
  if (base === null) return null
  const prefix = prefixText === undefined ? bits : Number(prefixText)
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > bits) return null
  const mask =
    prefix === 0 ? BigInt(0) : ((BigInt(1) << BigInt(prefix)) - BigInt(1)) << BigInt(bits - prefix)
  return { base: base & mask, mask, bits }
}

const V4_RANGES: readonly CidrRange[] = DATACENTER_V4.map(parseCidr).filter(
  (range): range is CidrRange => range !== null
)
const V6_RANGES: readonly CidrRange[] = DATACENTER_V6.map(parseCidr).filter(
  (range): range is CidrRange => range !== null
)

/**
 * 是否为数据中心 / 云主机 / VPS 网段。空值、内网地址、非法地址一律返回 false。
 * IPv4-mapped IPv6（::ffff:a.b.c.d）按 IPv4 处理。
 */
export function isDatacenterIp(ip: string | null | undefined): boolean {
  if (!ip) return false
  let value = ip.trim().toLowerCase()
  if (!value || value === "unknown") return false
  const mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) value = mapped[1]

  const isV6 = value.includes(":")
  const parsed = isV6 ? ipv6ToBigInt(value) : ipv4ToBigInt(value)
  if (parsed === null) return false

  const ranges = isV6 ? V6_RANGES : V4_RANGES
  for (const range of ranges) {
    if (range.bits === (isV6 ? 128 : 32) && (parsed & range.mask) === range.base) return true
  }
  return false
}
