# 运维与通用参考

> 技术栈: Next.js 15 (standalone) + PostgreSQL 16 + Nginx + PM2
>
> **部署只有一条路径**：系统 Node + PM2 + 系统 Nginx。
> 完整部署流程见 **[部署指南](./通用独立站%20DEPLOYMENT.md)**，本文件只收录与部署方式无关的
> 运维、监控、备份、支付/邮件/SEO 等通用配置。
>
> 本文中的 `your-domain.com` / `Your Company` / `admin@example.com` 均为占位符，
> 请按 **[部署指南](./通用独立站%20DEPLOYMENT.md)** 开头的说明替换成你自己的域名、公司名和邮箱。

---

## 目录

1. [环境变量说明](#1-环境变量说明)
2. [管理后台初始化](#2-管理后台初始化)
3. [数据库备份与恢复](#3-数据库备份与恢复)
4. [Stripe 配置](#4-stripe-配置)
5. [PayPal 配置](#5-paypal-配置)
6. [OpenAI 配置](#6-openai-配置)
7. [邮件服务配置](#7-邮件服务配置)
8. [监控与日志](#8-监控与日志)
9. [安全 Checklist](#9-安全-checklist)
10. [SEO 优化](#10-seo-优化)
11. [GEO (生成式引擎优化)](#11-geo-生成式引擎优化)
12. [CDN 加速与缓存](#12-cdn-加速与缓存)
13. [CI/CD 自动部署](#13-cicd-自动部署)
14. [故障排查（通用）](#14-故障排查通用)

---

## 1. 环境变量说明

完整的 `.env` 配置：

```bash
# ========== 数据库 ==========
# 主机名固定为 localhost（PostgreSQL 直装在宿主机上）
DATABASE_URL="postgresql://b2b_user:密码@localhost:5432/b2b_independent_site?schema=public"

# ========== NextAuth 认证 ==========
NEXTAUTH_SECRET="$(openssl rand -base64 32)"  # 生成随机密钥
NEXTAUTH_URL="https://your-domain.com"

# Google OAuth (可选)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Apple OAuth (可选)
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""

# ========== Stripe 支付 (暂未启用，可留空) ==========
# STRIPE_SECRET_KEY="sk_live_..."
# STRIPE_WEBHOOK_SECRET="whsec_..."
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# ========== PayPal 支付 ==========
NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-secret"
PAYPAL_API_URL="https://api-m.paypal.com"

# ========== OpenAI ==========
OPENAI_API_KEY="sk-..."

# ========== Gmail SMTP ==========
# Gmail 需开启两步验证 + 使用"应用专用密码"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-app-password"
SMTP_FROM="Your Store <your-email@gmail.com>"

# ========== 站点配置 (站点身份由后台 Settings 驱动，此处仅作为构建期兜底) ==========
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
NEXT_PUBLIC_SITE_NAME="Your Store Name"

# ========== 物流追踪 17Track ==========
NEXT_PUBLIC_17TRACK_API_KEY=""

# ========== 文件上传 ==========
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# ========== 其他可选 ==========
RESEND_API_KEY=""
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=""
NEXT_PUBLIC_BING_VERIFICATION=""
NEXT_PUBLIC_TWITTER_HANDLE=""
```

### 密钥生成

```bash
openssl rand -base64 32   # 生成 NEXTAUTH_SECRET
```

> **提示**: `NEXT_PUBLIC_*` 是构建期变量，改动后需重新 `npm run build:server` 并重启 PM2。

---

## 2. 管理后台初始化

部署完成后运行 `db:seed`（两种方式都会自动执行）即创建管理员账号。

**默认管理员凭据：**

| 字段 | 值 |
|------|-----|
| 邮箱 | `.env` 中的 `SEED_ADMIN_EMAIL`（默认 `admin@example.com`） |
| 密码 | `Admin123!` |

> **重要**：登录后台后请立即修改默认密码。

后台地址：`https://your-domain.com/admin`

安全：所有 `/admin/*` 路由由 `src/middleware.ts` 保护（未登录→登录页；非 ADMIN→首页），每个管理页还会服务端二次校验身份。

---

## 3. 数据库备份与恢复

```bash
# 手动备份（-Fc 自定义格式，恢复更完整；迁移服务器时用这个）
mkdir -p /backup
pg_dump -U b2b_user -Fc b2b_independent_site > /backup/b2b-$(date +%Y%m%d).dump

# 自动备份脚本
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
set -euo pipefail
BACKUP_DIR="/backup"
PROJECT_DIR="/var/www/b2b-independent-site"
DB_NAME="b2b_independent_site"
DB_USER="b2b_user"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR
# 数据库
pg_dump -U $DB_USER -Fc $DB_NAME > "$BACKUP_DIR/$DB_NAME-$(date +%Y%m%d-%H%M%S).dump"
# 上传的图片必须一起备份，否则恢复后前台商品图全部 404
tar czf "$BACKUP_DIR/uploads-$(date +%Y%m%d-%H%M%S).tar.gz" -C $PROJECT_DIR uploads
# .env 里的 NEXTAUTH_SECRET 丢了会导致已登录会话与 OAuth 回调失效
cp $PROJECT_DIR/.env "$BACKUP_DIR/env-$(date +%Y%m%d-%H%M%S)"

find $BACKUP_DIR -name "*.dump" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "uploads-*.tar.gz" -mtime +$RETENTION_DAYS -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# 每天凌晨 3 点执行
echo '0 3 * * * /usr/local/bin/backup-db.sh' | crontab -
```

> 恢复：`sudo -u postgres pg_restore -U postgres -d b2b_independent_site --no-owner --role=b2b_user /backup/b2b-YYYYMMDD.dump`

---

## 4. Stripe 配置

> **当前状态**: Stripe 支付暂未启用，先保留代码和配置模板，后期启用。部署时 Stripe 相关环境变量可留空。

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. 点击 **Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/checkout/webhook`
4. 监听事件: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. 获取 Signing secret (`whsec_...`) 填入 `.env`

本地测试：

```bash
stripe listen --forward-to localhost:3000/api/checkout/webhook
stripe trigger payment_intent.succeeded
```

---

## 5. PayPal 配置

### 获取凭据

1. 登录 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 创建 App，获取 **Client ID** 和 **Secret**
3. 填入 `NEXT_PUBLIC_PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`

### 环境切换

```bash
# 沙箱
PAYPAL_API_URL="https://api-m.sandbox.paypal.com"
# 生产
PAYPAL_API_URL="https://api-m.paypal.com"
```

### 中国商业 PayPal 注意事项

- 使用标准的 PayPal Commerce Platform
- 支持美元 (USD) 结算
- **不需要**香港公司或海外实体，仅需中国营业执照即可申请商业 PayPal

---

## 6. OpenAI 配置

AI 客服聊天使用 `gpt-4o-mini`，成本较低。

1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys) 创建 API Key
2. `.env` 配置 `OPENAI_API_KEY="sk-..."`
3. 建议在 Dashboard 设置每月消费上限

---

## 7. 邮件服务配置

系统使用 **nodemailer** + Gmail SMTP。

1. 开启两步验证：https://myaccount.google.com/security
2. 生成应用专用密码：https://myaccount.google.com/apppasswords
3. 配置 `.env`（见上文环境变量，`SMTP_PASS` 填 16 位应用专用密码）

| 邮件类型 | 触发条件 |
|---------|---------|
| 订单确认 | 下单成功 |
| 发货通知 | 订单发货（含 Tracking Number）|
| 购物车放弃提醒 | 用户加购但未结算 24h |
| 密码重置 | 忘记密码提交邮箱（1 小时有效）|
| Newsletter | 用户订阅 |

> 使用其他 SMTP 服务商只需改 `SMTP_HOST` / `SMTP_PORT`，代码无需改动。

---

## 8. 监控与日志

### 系统监控

```bash
htop
df -h
free -h
```

### 应用与日志（PM2）

```bash
pm2 monit
tail -f /var/www/b2b-independent-site/logs/out.log
tail -f /var/www/b2b-independent-site/logs/err.log
tail -f /var/log/nginx/b2b-independent-site-access.log
journalctl -u postgresql -f
```

### 数据库监控

```bash
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 9. 安全 Checklist

### 服务器 / 数据库

- [ ] SSH 密钥登录，禁用密码登录
- [ ] UFW 防火墙仅开放 22/80/443 入站
- [ ] fail2ban 已启用
- [ ] 自动安全更新启用
- [ ] Node/应用仅监听 `127.0.0.1`
- [ ] PostgreSQL 仅监听 localhost / 容器内网
- [ ] `NEXTAUTH_SECRET` 使用强随机字符串
- [ ] 定期数据库备份到异地

### 防木马/挖矿（部署后及每周复查）

```bash
ps aux | grep -E "xmrig|minerd|kdevtmpfs|kinsing"
ss -antp | grep "ESTAB" | grep -v "127.0.0.1"
systemctl list-units --type=service --state=running
cat /etc/crontab 2>/dev/null; ls /etc/cron.d/ 2>/dev/null; crontab -l
cat ~/.ssh/authorized_keys
```

> 一旦确认被植入挖矿木马或 rootkit，**最安全的方式是重装系统**。

### 应用

- [ ] HTTPS 强制跳转 + HSTS
- [ ] 安全头已配置（X-Frame-Options 等）
- [ ] 上传大小限制（`client_max_body_size 50M`）
- [ ] `.env` 不进入 git（`.gitignore` 已配置 `.env*`）

### 紧急响应

```bash
# 切断网络
sudo ufw deny out to any
sudo ufw deny in to any
# 备份数据
pg_dump -U b2b_user -Fc b2b_independent_site > /backup/emergency-$(date +%Y%m%d).dump
# 停止应用
pm2 delete b2b-independent-site
```

---

## 10. SEO 优化

项目已内置 JSON-LD 结构化数据（Organization/WebSite/Brand、Product、BlogPosting、FAQ QAPage、AboutPage 等）。

### 部署后验证

```bash
# sitemap（自动生成，实时查询数据库）
curl https://your-domain.com/sitemap.xml | grep -o "<loc>[^<]*</loc>"

# robots.txt
curl https://your-domain.com/robots.txt

# Google Rich Results Test
# https://search.google.com/test/rich-results
```

### 提交搜索引擎

```bash
# Google Search Console
# 1. https://search.google.com/search-console 添加域名并验证（推荐 DNS TXT）
# 2. Sitemaps → 提交 sitemap.xml

# Bing Webmaster Tools
# https://www.bing.com/webmasters/ 添加站点并提交 sitemap.xml
```

### Core Web Vitals

- 静态资源缓存：`/_next/static/` 365d、`/static/` 30d（Nginx 已配置）
- 图片优化：`next/image` + sharp
- 用 Lighthouse / PageSpeed Insights 验证（目标 Performance ≥ 90）

### SEO CheckList

- [ ] Search Console / Bing Webmaster 添加并验证
- [ ] sitemap.xml 已提交
- [ ] 各页面 JSON-LD 通过 Rich Results Test
- [ ] 每页唯一 title/description/canonical
- [ ] google-site-verification / msvalidate.01 注入
- [ ] Core Web Vitals 达标

---

## 11. GEO (生成式引擎优化)

**GEO** 针对 AI 生成式搜索引擎（ChatGPT Search / Google AI Overviews / Perplexity）优化，让 LLM 优先引用你的品牌内容。

### 已内置能力

| 数据源 | 后台位置 | 用途 |
|--------|---------|------|
| 站点名称/描述/Logo | `/admin/settings` → SEO | 全局 Organization/WebSite/Brand schema |
| FAQ 问答 | `/admin/faq` | 每个问答生成独立 `QAPage` schema |
| 商品/分类/页面/博客 | 后台管理 | Product / ProductGroup / Article / BlogPosting |

### 验证

```bash
# ChatGPT Search: "What does {Your Store} sell?"
# Perplexity: "{your product} {your domain}"
# Rich Results Test 验证 QAPage / Speakable / HowTo / ProductGroup
```

### 持续优化

- 后台维护 5-10 个高质量 FAQ
- 每个产品配 HowTo 步骤
- 博客 h1/h2/blockquote 写可引用段落
- 定期在 AI 搜索中检查品牌引用

---

## 12. CDN 加速与缓存

推荐 **Cloudflare**（Free 计划）。

### 部署

1. 添加域名到 Cloudflare，改 Nameservers
2. DNS: `A` 记录 `@` / `www` → 服务器 IP，**开启橙色云朵（Proxy）**
3. SSL/TLS: `Full (strict)`（服务器需有 Let's Encrypt 证书）
4. Caching → Cache Rules（**只缓存静态资源，绝不缓存 HTML / RSC**，见下方「缓存规则」）
5. Speed → 开启 Auto Minify / Brotli / Early Hints / HTTP2+HTTP3
6. Security → WAF / Bot Fight Mode / 速率限制（`/api/auth/*` 5次/60s）

### 缓存规则（重要：配错会导致部署后首页打不开）

Next.js 的 HTML 里引用 `/_next/static/chunks/**.js`，文件名带构建哈希；每次 `npm run build`
哈希都会变。**若让 Cloudflare 缓存 HTML，构建后边缘仍返回旧 HTML，里面引用的是已被删除的
旧 chunk（404），浏览器加载 JS 失败 → 组件树报错 → 前端错误边界（表现为「首页 500 / Something
Went Wrong」）。**

还有第二种更隐蔽的故障：软导航（点链接）会用**同一个 URL** 拉取 RSC payload
（`Content-Type: text/x-component`），只是多带一个 `RSC` 请求头。CSS/普通请求按 URL 缓存，
**CDN 层不认自定义 `Vary` 头**，于是这份 flight 数据被按 HTML 的 URL 缓存下来，之后
`https://your-domain.com/en` 直接访问就返回 flight 文本（**页面显示乱码**）。两种故障的根因都是
「让 CDN 缓存了页面 HTML/RSC」。

源站已做加固，但**最终仍需在 Cloudflare 侧确认**：

- `src/middleware.ts` 与 nginx 模板对页面响应统一下发 `CDN-Cache-Control: no-store`
  （RSC 请求额外下发 `Cache-Control: no-store`）。Cloudflare 对 Cache Rules 会优先读
  `CDN-Cache-Control`，据此 **BYPASS**，不再缓存。
- **但 Page Rules 的「Cache Everything」会连 `CDN-Cache-Control` 一起忽略**，必须删除；
  否则源站下发什么都没用。

只加下面两条规则，**不要**再给「HTML 页面」加任何缓存规则：

| # | 匹配（When incoming requests match） | 动作 |
|---|--------------------------------------|------|
| 1 | `starts_with(http.request.uri.path, "/_next/static/")` 或 `"/static/"` | Cache eligibility: **Eligible**，Edge TTL **365 days**（`/static/` 30 days） |
| 2 | `any(http.request.headers["rsc"][*] ne "")`（即携带 `RSC` 头的软导航请求） | Cache eligibility: **Bypass cache** |

> 其它所有路径（HTML、`/api`、RSC 之外的页面请求）默认 **不命中缓存**，直接回源。
> 若你曾在 Page Rules / Cache Rules 里配过「HTML → 10 minutes」「Cache Everything」，
> **请删除**——`Cache Everything` 会忽略源站的 `Cache-Control` / `CDN-Cache-Control`，
> 正是本次「首页乱码 / 旧 HTML」故障原因。修复后必须 Purge Everything 清掉已被污染的条目。

**每次部署后必须清缓存**：Cloudflare 控制台 → Caching → Configuration → **Purge Everything**
（或只 Purge 首页/对应 URL）。否则边缘最长会继续返回旧 HTML 到 TTL 到期。
> 命令行清缓存（可选）：`curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" --data '{"purge_everything":true}'`

### Nginx 配合

```bash
# Cloudflare 真实 IP
sudo nano /etc/nginx/conf.d/cloudflare.conf
# set_real_ip_from <cf ranges>; real_ip_header X-Forwarded-For;
# 范围列表见 https://www.cloudflare.com/ips/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 13. CI/CD 自动部署

以 PM2 直跑为例，GitHub Actions + GitHub Secrets（`HOST` / `USERNAME` / `SSH_KEY` / `DATABASE_URL`）：

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci --legacy-peer-deps
      - run: npm run db:generate
      - run: npm run build:server
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          source: ".,!node_modules"
          target: "/var/www/b2b-independent-site"
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/b2b-independent-site
            npm ci --legacy-peer-deps
            npm run db:generate
            npm run db:migrate
            npm run db:seed
            npm run build:server
            pm2 restart b2b-independent-site
```

---

## 14. 故障排查（通用）

| 现象 | 排查 |
|------|------|
| 502 Bad Gateway | `curl http://localhost:3000/api/health`（不依赖 DB）→ 应用是否在跑；`nginx -t` |
| 迁移报错 | 先 `db:migrate` 再 `db:seed`；旧库重置后重跑 |
| `npm install` ERESOLVE | 统一 `npm ci --legacy-peer-deps` |
| OOM | 加 swap；构建已内置 `NODE_OPTIONS=--max-old-space-size=4096` |
| SSL 到期 | `sudo certbot renew --force-renewal`；检查 `/etc/letsencrypt/live/` |
| 内存不足 | `free -h`；PM2 `--max-memory-restart 1G` |

部署流程与站点特有的排查见 [部署指南 §13 故障排查](./通用独立站%20DEPLOYMENT.md#13-故障排查)。

---

完整部署流程见 **[部署指南](./通用独立站%20DEPLOYMENT.md)**。

> 最后更新: 2026-09-18