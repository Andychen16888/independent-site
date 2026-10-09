/**
 * 爬虫 / 机器人 / 监控脚本的 User-Agent 判定。
 *
 * 后台「数据分析」过去把所有能执行 JS 的客户端都算作访客。搜索引擎与 SEO 爬虫
 * （SemrushBot、bingbot、OAI-SearchBot、AhrefsBot…）不执行 JS，本来就进不了埋点；
 * 但无头爬虫、站点监控探针和 AI 抓取器会执行 JS，被记成「访客」后把真人数据淹没。
 * 这里按 UA 主动识别，埋点时写入 isBot 标记，后台默认只统计真人。
 *
 * 采用「包含式」匹配而非精确 UA 清单：UA 变体太多，宁可多标几个机器人，也不要把
 * 真人误伤——所以只收录明确属于机器人的关键词。空 UA 也视为机器人（真实浏览器必带 UA）。
 *
 * 迁移 20261009000000_visit_event_is_bot 的历史回填用同一套关键词（写成 SQL 正则），
 * 改动此列表时应同步更新那条迁移里的正则。
 */
const BOT_UA_PATTERN = new RegExp(
  [
    // 通用爬虫词根
    "bot",
    "crawl",
    "spider",
    "slurp",
    "scrapy",
    "mediapartners",
    // 社交 / 链接预览抓取
    "facebookexternalhit",
    "twitterbot",
    "linkedinbot",
    "slackbot",
    "telegrambot",
    "discordbot",
    "whatsapp",
    "skypeuripreview",
    "embedly",
    "quora link preview",
    "pinterest",
    "vkshare",
    "redditbot",
    // 搜索引擎
    "google-inspectiontool",
    "storebot-google",
    "googleother",
    "apis-google",
    "adsbot-google",
    "feedfetcher-google",
    "google favicon",
    "google-read-aloud",
    "bingbot",
    "msnbot",
    "duckduckbot",
    "applebot",
    "baiduspider",
    "yandex",
    "sogou",
    "exabot",
    "qwantify",
    "seznambot",
    "petalbot",
    "bytespider",
    "yisouspider",
    // SEO / 营销分析
    "semrush",
    "ahrefs",
    "mj12",
    "dotbot",
    "dataforseo",
    "screaming frog",
    "blexbot",
    "rogerbot",
    "majestic",
    "meltwater",
    // AI 抓取
    "gptbot",
    "chatgpt",
    "oai-searchbot",
    "claude",
    "anthropic",
    "perplexity",
    "ccbot",
    "amazonbot",
    "amzn-searchbot",
    "meta-externalagent",
    "meta-webindexer",
    "imagesift",
    "diffbot",
    "youbot",
    "google-extended",
    // 监控 / 性能 / 健康检查
    "uptimerobot",
    "pingdom",
    "statuscake",
    "datadog",
    "newrelicpinger",
    "betteruptime",
    "site24x7",
    "thousandeyes",
    "gtmetrix",
    "lighthouse",
    "pagespeed",
    "monitor",
    "uptime",
    "kube-probe",
    "elb-healthchecker",
    "googlehc",
    "route53-health",
    "check_http",
    "prometheus",
    "blackbox_exporter",
    "zabbix",
    // 脚本 / 命令行 / 无头浏览器
    "headlesschrome",
    "phantomjs",
    "puppeteer",
    "playwright",
    "python",
    "aiohttp",
    "httpx",
    "curl/",
    "wget",
    "go-http-client",
    "java/",
    "okhttp",
    "libwww-perl",
    "apache-httpclient",
    "node-fetch",
    "axios",
    "postmanruntime",
    "insomnia",
    "zgrab",
    "masscan",
    "nmap",
    "censys",
    "expanse",
    "firecrawl",
    "scanner",
    "validator",
    // 网页归档
    "archive.org",
    "ia_archiver",
  ].join("|"),
  "i"
)

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true
  const ua = userAgent.trim()
  if (ua.length < 4) return true
  return BOT_UA_PATTERN.test(ua)
}
