/**
 * 访客来源（Traffic source）识别。
 *
 * 外贸独立站最关心的是「客户从哪来」：搜索引擎（Google / Bing / 百度）的自然流量、
 * 邮件推广、社媒和外部链接。后台「数据分析」过去只有访问轨迹与国家，看不到来源，
 * 无法判断哪条推广渠道有效。
 *
 * 识别优先级（从高到低）：
 *   1. 推广链接参数 utm_source / utm_medium —— 最可信，邮件、广告投放都靠它归因；
 *   2. HTTP Referer 的主机名 —— 区分搜索引擎、社媒、网页邮箱与普通外链；
 *   3. 都没有 → direct（直接访问 / 无法归因）。
 *
 * 迁移 20261014000000_add_traffic_source 的历史回填用同一套规则（写成 SQL 的 ILIKE
 * 模式），改动这里的域名列表时应同步更新那条迁移里的模式。
 */

export type TrafficSource =
  | "google"
  | "bing"
  | "baidu"
  | "search"
  | "direct"
  | "email"
  | "social"
  | "referral"

export const TRAFFIC_SOURCES: TrafficSource[] = [
  "google",
  "bing",
  "baidu",
  "search",
  "direct",
  "email",
  "social",
  "referral",
]

export type SourceGroup = "seo" | "other"

/**
 * UI 展示元数据。分组的取舍与「国际芯片交易网」一致：SEO 组里除主流搜索引擎外
 * 还包含 Direct（无法归因的直达流量，作为自然流量的基线对照），其余归入「其它来源」。
 */
export const SOURCE_META: Record<
  TrafficSource,
  { en: string; zh: string; group: SourceGroup }
> = {
  google: { en: "Google", zh: "Google", group: "seo" },
  bing: { en: "Bing", zh: "Bing", group: "seo" },
  baidu: { en: "Baidu", zh: "百度", group: "seo" },
  search: { en: "Other search", zh: "其它搜索引擎", group: "seo" },
  direct: { en: "Direct", zh: "直接访问", group: "seo" },
  email: { en: "Email", zh: "邮件推广", group: "other" },
  social: { en: "Social", zh: "社交媒体", group: "other" },
  referral: { en: "Referral", zh: "外部链接", group: "other" },
}

export function isTrafficSource(value: unknown): value is TrafficSource {
  return typeof value === "string" && (TRAFFIC_SOURCES as string[]).includes(value)
}

export function sourceLabel(source: string): { en: string; zh: string } {
  return isTrafficSource(source)
    ? { en: SOURCE_META[source].en, zh: SOURCE_META[source].zh }
    : { en: source, zh: source }
}

function hostOf(url: string | null | undefined): string {
  if (!url) return ""
  const trimmed = url.trim()
  if (!trimmed) return ""
  try {
    return new URL(trimmed).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    // Referer 偶尔是不带协议的主机名，退回到简单解析。
    const match = trimmed.toLowerCase().match(/(?:^|\/\/)([a-z0-9.-]+\.[a-z]{2,})/i)
    return match ? match[1].replace(/^www\./, "") : ""
  }
}

function hostMatches(host: string, domains: string[]): boolean {
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

function hostIncludes(host: string, tokens: string[]): boolean {
  return tokens.some((token) => host.includes(token))
}

const SEARCH_ENGINES: Array<{ test: RegExp; source: TrafficSource }> = [
  { test: /(^|\.)google\./, source: "google" },
  { test: /(^|\.)(bing|msn)\./, source: "bing" },
  { test: /(^|\.)baidu\./, source: "baidu" },
  {
    test: /(^|\.)(yahoo|duckduckgo|yandex|sogou|naver|ecosia|qwant|aol|ask|brave|startpage|seznam|yandex)\./,
    source: "search",
  },
]

const SOCIAL_DOMAINS = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "t.co",
  "linkedin.com",
  "lnkd.in",
  "pinterest.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "reddit.com",
  "whatsapp.com",
  "wa.me",
  "telegram.org",
  "t.me",
  "weixin.qq.com",
  "wechat.com",
  "vk.com",
  "snapchat.com",
  "quora.com",
  "tumblr.com",
  "medium.com",
  "line.me",
  "discord.com",
  "discord.gg",
  "douyin.com",
  "xiaohongshu.com",
]

/** 网页邮箱域名片段：从邮箱里点链接过来的归为邮件推广。 */
const EMAIL_HOST_TOKENS = [
  "mail.google",
  "mail.yahoo",
  "mail.163",
  "mail.qq",
  "mail.ru",
  "outlook.",
  "hotmail.",
  "live.com",
  "webmail",
  "proton",
  "foxmail",
  "exmail.",
  "zoho.",
  "gmx.",
  "aol.",
]

/** utm_source 里出现这些词视为邮件推广。 */
const EMAIL_SOURCE_TOKENS = [
  "email",
  "newsletter",
  "mailchimp",
  "sendgrid",
  "mailerlite",
  "brevo",
  "sendinblue",
  "klaviyo",
  "resend",
  "mailer",
  "campaign",
]

const SEARCH_SOURCE_TOKENS = ["google", "bing", "msn", "baidu", "yahoo", "duckduckgo", "yandex", "sogou"]

const SOCIAL_SOURCE_TOKENS = [
  "facebook",
  "fb",
  "instagram",
  "twitter",
  "linkedin",
  "pinterest",
  "youtube",
  "tiktok",
  "reddit",
  "whatsapp",
  "telegram",
  "wechat",
  "weixin",
  "vk",
  "snapchat",
  "quora",
  "douyin",
  "xiaohongshu",
]

function sourceFromUtm(utmSource: string | null, utmMedium: string | null): TrafficSource | null {
  const source = (utmSource || "").trim().toLowerCase()
  const medium = (utmMedium || "").trim().toLowerCase()

  if (medium) {
    if (["email", "e-mail", "newsletter", "mail"].includes(medium)) return "email"
    if (["social", "social-media", "social_media"].includes(medium)) return "social"
  }
  if (!source) return null

  if (EMAIL_SOURCE_TOKENS.some((token) => source.includes(token))) return "email"
  if (source.includes("google")) return "google"
  if (source.includes("bing") || source.includes("msn")) return "bing"
  if (source.includes("baidu")) return "baidu"
  if (SEARCH_SOURCE_TOKENS.some((token) => source.includes(token))) return "search"
  if (SOCIAL_SOURCE_TOKENS.some((token) => source === token || source.startsWith(`${token}_`) || source.startsWith(`${token}-`))) {
    return "social"
  }
  return "referral"
}

/**
 * 把一个访客的首次落地信息归类为 TrafficSource。
 *
 * @param siteHost 本站主机名（去掉 www），用于把站内跳转的 Referer 判为 direct。
 */
export function classifySource(input: {
  referrer?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  siteHost?: string | null
}): TrafficSource {
  const fromUtm = sourceFromUtm(input.utmSource ?? null, input.utmMedium ?? null)
  if (fromUtm) return fromUtm

  const host = hostOf(input.referrer)
  if (!host) return "direct"

  const siteHost = (input.siteHost || "").toLowerCase().replace(/^www\./, "")
  if (siteHost && (host === siteHost || host.endsWith(`.${siteHost}`))) return "direct"

  for (const engine of SEARCH_ENGINES) {
    if (engine.test.test(host)) return engine.source
  }
  if (hostMatches(host, SOCIAL_DOMAINS)) return "social"
  if (hostIncludes(host, EMAIL_HOST_TOKENS)) return "email"
  return "referral"
}

/** 从落地 URL 里读取 UTM 参数（客户端没有上报 UTM 时的服务端兜底）。 */
export function utmFromUrl(url: string | null | undefined): {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
} {
  if (!url) return { utmSource: null, utmMedium: null, utmCampaign: null }
  try {
    const params = new URL(url).searchParams
    return {
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
    }
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null }
  }
}

/**
 * 给外发邮件里的链接补上 UTM 参数，便于在后台按 utm_campaign 归因邮件推广效果。
 * 已有同名参数时保留原值，避免覆盖运营手动标记的链接。
 */
export function appendUtmParams(
  url: string,
  utm: { source: string; medium: string; campaign?: string | null }
): string {
  try {
    const parsed = new URL(url)
    if (!parsed.searchParams.has("utm_source")) parsed.searchParams.set("utm_source", utm.source)
    if (!parsed.searchParams.has("utm_medium")) parsed.searchParams.set("utm_medium", utm.medium)
    if (utm.campaign && !parsed.searchParams.has("utm_campaign")) {
      parsed.searchParams.set("utm_campaign", utm.campaign)
    }
    return parsed.toString()
  } catch {
    return url
  }
}
