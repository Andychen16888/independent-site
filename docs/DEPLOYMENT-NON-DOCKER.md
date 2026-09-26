# 部署指南 ②：非 Docker 部署（PM2 直跑，推荐）

> 适用：1 核 2GB 起步的小内存 VPS（Vultr / DigitalOcean 等），已用于生产环境验证。
> 技术栈：Ubuntu 22.04 + Node.js 20 + PostgreSQL 16 + Nginx + PM2
> 配套文档：[Docker 部署教程](./DEPLOYMENT-DOCKER.md)　|　[部署总览与通用参考](./DEPLOYMENT.md)
>
> ⚠️ 本教程与 Docker 教程**互相独立**，二选一即可。请全程只按本教程执行，不要混用两个教程的命令。
>
> 🚨 **服务器疑似被入侵（挖矿程序 / 后门账号 / CPU 满载）？不要在原机上修，直接看
> [服务器被入侵后的恢复清单](./INCIDENT-RECOVERY.md)。**

---

## 目录

1. [服务器准备与安全加固](#1-服务器准备与安全加固)
2. [安装依赖](#2-安装依赖)
3. [配置 PostgreSQL](#3-配置-postgresql)
4. [获取代码与环境变量](#4-获取代码与环境变量)
5. [构建应用](#5-构建应用)
6. [数据库迁移与种子数据](#6-数据库迁移与种子数据)
7. [启动应用 (PM2)](#7-启动应用-pm2)
8. [Nginx 配置](#8-nginx-配置)
9. [SSL 证书 (Let's Encrypt)](#9-ssl-证书-lets-encrypt)
10. [验证部署](#10-验证部署)
11. [更新部署](#11-更新部署)
12. [运维命令](#12-运维命令)
13. [故障排查](#13-故障排查)
14. [通用参考（支付/邮件/SEO/管理后台）](#14-通用参考支付邮件seo管理后台)

---

## 1. 服务器准备与安全加固

### 1.1 最低配置

| 配置项 | 最低 | 推荐 |
|--------|------|------|
| CPU | 1 核 | 2 核 |
| 内存 | 2 GB（建议加 2G swap） | 4 GB |
| 硬盘 | 20 GB SSD | 40 GB SSD |
| 系统 | Ubuntu 22.04 | Ubuntu 22.04 LTS |

> 1 核 2G 小机器强烈建议先加 swap，防止 `next build` 时 OOM：
>
> ```bash
> sudo fallocate -l 2G /swapfile
> sudo chmod 600 /swapfile
> sudo mkswap /swapfile
> sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

### 1.2 安全加固（部署前必须完成）

> **原则**：新服务器在完成加固前，暴露时间越短越好。以下步骤在安装任何依赖 / 克隆代码**之前**完成。

#### 1.2.0 先选一种 SSH 登录方式

| 方案 | 登录方式 | 适合 | 安全性 |
|------|---------|------|--------|
| **A** | SSH 密钥（关闭密码登录） | 多设备、需要脚本/CI 免密登录 | ★★★★★ |
| **B** | 密码登录 + 端口加固 | 单人单机维护、只想记住一个密码 | ★★☆☆☆ |

> ⚠️ **方案 B 的现实风险**：公网 IP 上的密码登录是持续被爆破的目标。本项目此前的服务器
> 就是被植入后门账号（crontab 反复创建带密码用户）而沦陷的。若选方案 B，
> **下面的「改 SSH 端口」和「fail2ban 收紧」两步是必须的，不是可选的**。
>
> 🔒 无论选哪个，都遵守同一条铁律：**每改一项就另开一个终端验证能登回来，再改下一项。**

公共步骤（两个方案都要做）：

```bash
# 连接服务器
ssh root@your-server-ip

# 更新系统
apt update && apt upgrade -y

# 基础工具 + fail2ban + 自动安全更新
apt install -y curl wget git vim fail2ban unattended-upgrades
systemctl enable --now fail2ban
systemctl enable --now unattended-upgrades
```

---

#### 1.2.A 方案 A：SSH 密钥登录（推荐）

```bash
# 1. 在【本地】执行，把公钥装到服务器（这一步在服务器上不做）
#      ssh-copy-id -i ~/.ssh/id_ed25519.pub root@your-server-ip
#    若还没有密钥对：ssh-keygen -t ed25519 -C "b2b-server"

# 2. 在服务器上确认公钥已就位
ls -l /root/.ssh/authorized_keys && wc -l /root/.ssh/authorized_keys

# 3. 在【本地】强制用密钥登录一次，验证成功再继续
#      ssh -o PreferredAuthentications=publickey -o PasswordAuthentication=no root@IP

# 4. 确认可用后才关闭密码登录
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
systemctl reload sshd

# 5. 复核
sshd -T | grep -E 'pubkeyauthentication|passwordauthentication'
#    期望：pubkeyauthentication yes
#          passwordauthentication no
```

---

#### 1.2.B 方案 B：密码登录 + 端口加固

> 保留密码登录，但用「强密码 + 改端口 + fail2ban 严打」把风险压到可接受。
> 改端口这一条性价比最高：全网自动爆破脚本绝大多数只扫 22，改掉后噪音基本消失。

```bash
# 1. 设置一个强密码（不要用 Vultr 默认密码，不要和其它服务复用）
passwd root

# 2. 改 SSH 端口（避开 22，这是最关键的一步）
sed -i 's/^#\?Port .*/Port 2222/' /etc/ssh/sshd_config
grep -n '^Port' /etc/ssh/sshd_config          # 期望：Port 2222

# 3. 同步改防火墙规则：放行 2222，同时把 22 关掉
ufw allow 2222/tcp
ufw delete allow 22/tcp 2>/dev/null || true
ufw status numbered | grep -E '2222|22/tcp'

# 4. 重载 sshd，然后【另开 PuTTY 会话】用 2222 端口登录确认
#    ★★★ 这一步没验证通过之前，不要关闭当前会话 ★★★
systemctl reload sshd
#    PuTTY 配置：Session → Port 改成 2222

# 5. 收紧 fail2ban（密码登录必须配合它）
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 3
backend  = systemd

[sshd]
enabled  = true
EOF
systemctl restart fail2ban
fail2ban-client status sshd                # 确认 jail 正常
systemctl status fail2ban --no-pager | head -3

# 6. 确认密码登录仍开启（不要误关）
sshd -T | grep -E 'passwordauthentication|port'
#    期望：passwordauthentication yes
#          port 2222

# 7. 看一眼有没有正在爆破的 IP
fail2ban-client status sshd
```

**方案 B 后续维护**：以后每次连接要带端口（PuTTY 填 2222，或 `ssh -p 2222 root@IP`）。

---

#### 1.2.1 防火墙（两个方案共用）

> ⚠️ **不要一次性把 SSH 和防火墙全改完。** 若走方案 A，22 或 2222 都要在 `ufw enable`
> 之前放行，否则当前 SSH 会被踢掉。

```bash
ufw --force reset
ufw default deny incoming
ufw default deny outgoing
ufw allow in on lo
ufw allow out on lo

# SSH：方案 A 用 22，方案 B 用 2222（二选一，另一条注释掉）
ufw allow in 22/tcp
# ufw allow in 2222/tcp
ufw allow in 80/tcp
ufw allow in 443/tcp

# 出站：git clone(22) / DNS / npm·Stripe·PayPal·OpenAI·Let's Encrypt(443) / NTP / SMTP
ufw allow out 22/tcp
ufw allow out 53/udp
ufw allow out 53/tcp
ufw allow out 80/tcp
ufw allow out 443/tcp
ufw allow out 123/udp
ufw allow out 587/tcp
ufw allow out 465/tcp
ufw allow out 25/tcp

# ICMP：**不要**用 ufw 命令添加。ufw 的 CLI 不支持 ICMP 规则，
#   `ufw allow proto icmp` 和 `ufw allow in proto icmp` 都会报
#   ERROR: Need 'to' or 'from' clause —— 这不是语法写错，是 ufw 不提供该能力。
#
#   也不需要加：/etc/ufw/before.rules 默认已放行关键 ICMP 类型
#   （destination-unreachable 即 PMTU、time-exceeded、parameter-problem、
#     echo-request 即 ping），所以大响应不会因 PMTU 探测失败而卡住，服务器也能被 ping。
#   确认：grep -n 'icmp' /etc/ufw/before.rules
#
#   仅当需要"服务器主动 ping 外部"（default deny outgoing 会挡掉出站 ICMP）才加：
#     sed -i '/# End custom rules/i -A ufw-before-output -p icmp -j ACCEPT' /etc/ufw/before.rules
#     ufw reload

ufw --force enable
ufw status verbose

# 期望输出：Default: deny (incoming), deny (outgoing), disabled (routed)
#          22/tcp（或 2222/tcp）ALLOW IN   80/tcp ALLOW IN   443/tcp ALLOW IN
# 若要确认出站规则已生效：ufw status numbered | grep -E '53|123|443|587'
```

> 想简化成「出站不限制」，把 `ufw default deny outgoing` 换成 `ufw default allow outgoing` 即可，
> 下方的 `allow out` 规则留着也无害。

---

#### 1.2.2 自检清单与救援

- [ ] **另开一个终端**能重新登录（方案 A 用密钥 / 方案 B 用新端口 + 密码）
- [ ] `sshd -T | grep -E 'passwordauthentication|port'` 输出符合所选方案
- [ ] `ufw status` 里 SSH 端口（22 或 2222）是 ALLOW IN，80/443 也是
- [ ] `fail2ban-client status sshd` 正常显示 `Jail: sshd`
- [ ] 全部通过后，才可以关闭当前这个 PuTTY 会话

> **被锁在外面的救援办法**：Vultr 控制台 → 该实例 → **View Console**（网页 VNC，可用密码直接登录），
> 进去改回配置再 `systemctl reload sshd`：
> ```bash
> sed -i 's/^#\?Port .*/Port 22/' /etc/ssh/sshd_config     # 端口改回 22
> sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
> systemctl reload sshd
> ufw allow 22/tcp                                        # 防火墙补回 22
> ```
> VNC 登录不依赖 SSH，所以 SSH 配置坏掉也能进去——这条通道一定要留着。

---

## 2. 安装依赖

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v          # v20.x
npm -v           # 10.x

# PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt update
sudo apt install -y postgresql-16
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Nginx
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# PM2
sudo npm install -g pm2

# Redis (可选，用于缓存)
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

> **不要安装 Docker** —— 那是另一个部署方式（见 Docker 教程）。本教程用系统级 Node + PM2。

---

## 3. 配置 PostgreSQL

```bash
sudo -u postgres psql
```

在 psql 里执行（名称可自定义，后续 `.env` 保持一致）：

```sql
CREATE USER commerce_user WITH PASSWORD 'your-strong-password';
CREATE DATABASE commerce_db OWNER commerce_user;
GRANT ALL PRIVILEGES ON DATABASE commerce_db TO commerce_user;
\c commerce_db
GRANT ALL ON SCHEMA public TO commerce_user;
\q
```

> 数据库只需本地访问，**不要**开启远程连接（`listen_addresses` 保持 `localhost`）。

---

## 4. 获取代码与环境变量

```bash
cd /var/www
git clone https://github.com/Andychen16888/B2B-Independent-Site.git
chown -R root:root b2b-independent-site
cd b2b-independent-site
```

创建 `.env`：

```bash
cd /var/www/b2b-independent-site
cp .env.example .env
nano .env
```

**必填项**（其余可留空）：

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://commerce_user:密码@localhost:5432/commerce_db?schema=public` |
| `NEXTAUTH_SECRET` | 随机密钥 | `openssl rand -base64 32` 生成 |
| `NEXTAUTH_URL` | 站点 https 地址 | `https://commoditychina.com` |
| `NEXT_PUBLIC_SITE_URL` | 同站点地址 | `https://commoditychina.com` |
| `NEXT_PUBLIC_SITE_NAME` | 站点名 | `Commodities From China` |

> 详细变量说明见 [DEPLOYMENT.md § 环境变量](./DEPLOYMENT.md#环境变量)。

---

## 5. 构建应用

```bash
cd /var/www/b2b-independent-site

# 安装依赖（必须 --legacy-peer-deps，规避 Stripe/Auth.js 的 peer 冲突）
npm ci --legacy-peer-deps

# 生成 Prisma Client
npm run db:generate

# 构建 Next.js（standalone 模式，自动复制静态资源）
npm run build:server
```

> **说明**
> - 必须用 `npm ci --legacy-peer-deps`：`@stripe/react-stripe-js@6.3.0` 要求 `@stripe/stripe-js >=9.3.1 <10.0.0` 而项目锁定 `6.1.0`，不带 flag 会报 `ERESOLVE` 直接失败。
> - `next build` 时若 OOM，脚本已内置 `NODE_OPTIONS=--max-old-space-size=4096`；1 核 2G 机器请先加 swap（见 1.1）。
> - 构建产物在 `.next/standalone/`，**运行时必须用 `node .next/standalone/server.js`，不能用 `next start`**。

**构建好之后立刻确认产物存在：**

```bash
test -f .next/standalone/server.js && echo "build ok, ready to start"
```

如果没有输出 `build ok`，先回去重新构建，**禁止直接启动**。

---

## 6. 数据库迁移与种子数据

```bash
cd /var/www/b2b-independent-site

# 应用迁移（prisma migrate deploy，幂等，自动跳过已应用的部分）
npm run db:migrate

# 填充种子数据（管理员账号、页面、博客、站点设置、FAQ、导航菜单）
# 注意：种子数据不含演示商品/分类，不会再向已上线的数据库重复写入商品和分类
npm run db:seed
```

> **顺序不能错**：先 `db:migrate` 再 `db:seed`，否则 seed 报 `table does not exist`。
>
> **博客正文多语言翻译**：seed 只写入标题/摘要/SEO 的多语言，正文翻译需 AI 生成后写库（已在服务器配好 OPENAI_API_KEY 时执行）：
> ```bash
> # 为 6 篇文章 × 11 种语言生成正文翻译并写库（gpt-4o-mini，幂等：已有正文自动跳过，加 --force 强制重译）
> npm run db:translate-blog
> ```
>
> 项目迁移历史以 `20260917000000_init` 为唯一基线迁移（包含完整 schema 建表）。全新空库直接 `db:migrate` 即可，**无需先 `db push`**。
>
> 历史遗留排错：若首次迁移报 `relation "categories" does not exist`，说明是旧版依赖 `db push` 的迁移残留，重置空库后重跑：
> ```bash
> sudo -u postgres psql -d postgres -c 'DROP DATABASE IF EXISTS commerce_db;'
> sudo -u postgres psql -d postgres -c "CREATE DATABASE commerce_db OWNER commerce_user;"
> npm run db:migrate
> npm run db:seed
> ```

---

## 7. 启动应用 (PM2)

```bash
cd /var/www/b2b-independent-site

# 前置检查（若没有输出 build ok，先回到第 5 节构建）
test -f .next/standalone/server.js && echo "build ok, ready to start"

# 启动（ecosystem.config.js 已配置 HOST=127.0.0.1，仅本地监听）
pm2 start ecosystem.config.js

# 保存进程列表 + 设置开机自启（防止云服务器重启后网站打不开）
pm2 save
pm2 startup

# 查看状态
pm2 status
# 应显示 b2b-independent-site 为 online
```

> **开机自启（启动 PM2 时反复执行过一次即可，建议每次部署后 `pm2 save`）**
> - `pm2 startup` 会输出一行 systemd 命令（形如 `sudo env PATH=... pm2 startup systemd -u root --hp /root`），**把它复制执行一次**，才真正注册开机自启。已注册的话再次执行会提示 “already exist”。
> - `pm2 save` 把**当前**进程列表固化；以后每次 `pm2 restart` / `pm2 start` / `pm2 stop` 后都要重新 `pm2 save`，否则重启机器后恢复的是旧列表。
> - 用哪个用户启动 pm2，就用哪个用户执行 `pm2 startup`（本教程全程 root）。
> - 验证是否已注册开机自启：
>   ```bash
>   systemctl is-enabled postgresql          # enabled
>   systemctl is-enabled nginx               # enabled
>   systemctl is-enabled redis-server        # enabled
>   pm2 startup | grep -o "already exist" || pm2 startup
>   systemctl list-unit-files | grep pm2     # pm2-root.service enabled
>   ```
> - 完成后可整机重启验证一次：`reboot`，重启完 `curl http://localhost:3000/api/health` 应直接返回 `{"status":"ok",...}`。

> `ecosystem.config.js` 已指定 `script: ".next/standalone/server.js"`，无需手动传参。若直接启动：
> ```bash
> pm2 start .next/standalone/server.js --name b2b-independent-site -- --hostname 127.0.0.1
> ```

---

## 8. Nginx 配置

仓库自带完整 server 块模板 `b2b-independent-site.nginx.conf`（含 HTTP→HTTPS 跳转、静态缓存、上传代理）。复制并替换域名即可：

```bash
# 复制模板并替换 your-domain.com 为你的域名（示例：commoditychina.com）
sudo cp /var/www/b2b-independent-site/b2b-independent-site.nginx.conf /etc/nginx/sites-available/b2b-independent-site
sudo sed -i 's/your-domain.com/commoditychina.com/g' /etc/nginx/sites-available/b2b-independent-site

# 启用站点
sudo ln -sf /etc/nginx/sites-available/b2b-independent-site /etc/nginx/sites-enabled/

# 删除默认欢迎页站点（避免与本站 server_name 冲突）
sudo rm -f /etc/nginx/sites-enabled/default

# 创建模板里 proxy_cache_path 需要的缓存父目录（必须！nginx 不会自动创建父目录）
sudo mkdir -p /var/cache/nginx/b2b /var/cache/nginx/b2b_img
sudo chown -R www-data:www-data /var/cache/nginx

# 测试 + 重载
sudo nginx -t && sudo systemctl reload nginx
```

> 若 `nginx -t` 报 `cannot load certificate ... fullchain.pem`，说明 SSL 证书还没申请——去第 9 节先申请证书再回来测试。模板中的 80 端口 server 块保留。
>
> 若 `nginx -t` 报 `mkdir() "/var/cache/nginx/b2b" failed (2: No such file or directory)`，说明上面那两行 `mkdir -p` / `chown` 没执行（或服务器重启后被清理了）——补跑一次即可。
>
> 该模板默认：80 跳 443；`/_next/static` 缓存 365d；`/static/`、`/uploads/` 直读本地文件并回退 Node；`/api` 代理超时 360s（AI 多语言翻译等长任务不报 504）。

---

## 9. SSL 证书 (Let's Encrypt)

> **前置**：域名 A/AAAA 记录已解析到本服务器 IP；Nginx 80 端口配置已就绪。

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 申请证书（certbot 会自动改写 nginx 配置加 SSL；把域名替换成你的）
sudo certbot --nginx -d commoditychina.com -d www.commoditychina.com

# 测试自动续期
sudo certbot renew --dry-run
```

> ⚠️ `certbot --nginx` 会修改 nginx 配置文件，但可能移除站点自定义 location（安全头、/static/、/uploads/）。申请成功后**重新执行第 8 节**的复制+替换域名+重载命令，确保自定义配置恢复。证书文件本身不依赖站点配置，重载无影响。
>
> 若你更习惯手动 webroot 模式（先有 HTTP-only nginx，再补 HTTPS server 块），模板 `b2b-independent-site.nginx.conf` 的 80 block 已含 `/.well-known/acme-challenge/` 验证路径，可用：
> ```bash
> sudo certbot certonly --webroot -w /var/www/b2b-independent-site/public -d commoditychina.com -d www.commoditychina.com --email you@example.com --agree-tos --no-eff-email
> ```
> 之后恢复完整模板并替换域名即可。

---

## 10. 验证部署

```bash
# 1. PM2 运行状态
pm2 status

# 2. 健康检查（不依赖数据库）
curl http://localhost:3000/api/health
# 应返回 {"status":"ok","timestamp":"...","uptime":...,"memory":...}

# 3. 本机 HTTP
curl -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000

# 4. 从外部（域名已解析后）
curl -I https://commoditychina.com          # 期望 HTTP/2 200
curl -I http://commoditychina.com           # 期望 301 → https
```

---

## 11. 更新部署

> ## ⚡ 本次拉取（`ad79c62` CPU 优化）后：普通部署命令之外，**额外多一步** —— 重新复制 nginx 模板并 `nginx -t && reload`
>
> 原因：CPU 优化的 `/_next/image` 图片缓存加在 nginx 模板里，**`git pull` / 重建 / `pm2` 都覆盖不到**，不重载 nginx 就不会生效（改了代码也不会自动生效，必须手动重载一次）。
>
> | 改动 | 生效方式 |
> |------|----------|
> | `/_next/image` 缓存（nginx 新增 `b2b_img` cache zone + `location /_next/image`） | **只改 nginx 模板** → 必须 `cp 模板 → sed 换域名 → nginx -t && reload`（**本次必做**） |
> | sharp 宽度从 8 个减到 5/6 个（`next.config.ts`） | 在代码里，`npm run build` 即生效 |
> | ISR `revalidate` 300→3600（首页等 6 个页面）+ admin 更新即时 `revalidatePath` | 相同 |
> | `/api/track` 埋点 12s 突发去重 | 相同 |
>
> **如何判断以后某次更新是否也要重载 nginx**：`git log --stat -1 HEAD | grep nginx`
> - 有输出且文件是 `b2b-independent-site.nginx.conf` → 需要执行下方「重载 nginx 模板」步骤；
> - 有输出但文件是 `deploy/nginx.conf` → 那是 Docker 版，与你无关；
> - 没有输出 → 纯代码更新，跳过 nginx 步骤。
>
> 重载后如何确认缓存生效：
> ```bash
> # 1. 同一张 /_next/image 请求两次，第二次应从 MISS 变 HIT
> curl -s -o /dev/null -D - "https://YOUR_DOMAIN/_next/image?url=%2Fapi%2Fuploads%2Fany.webp&w=1080&q=75" | grep -i x-cache-status
> curl -s -o /dev/null -D - "https://YOUR_DOMAIN/_next/image?url=%2Fapi%2Fuploads%2Fany.webp&w=1080&q=75" | grep -i x-cache-status
> #   第一次 MISS（冷缓存）、第二次 HIT，即缓存已生效
> #
> # 2. 观察 CPU：爬虫抓图 / 访客看图高峰过后应明显回落
> top -bn1 | head -15        # 或 pm2 monit 看 b2b-independent-site 的 CPU%
> ```

每次拉取新代码后重新构建并重启：

```bash
cd /var/www/b2b-independent-site

git pull origin main
npm ci --legacy-peer-deps
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build:server
pm2 startOrReload ecosystem.config.js
pm2 save

# ↓↓↓ 本次 CPU 优化（ad79c62）必做：复制 nginx 模板并重载，否则 /_next/image 缓存不生效 ↓↓↓
# 纯代码更新且 git log --stat -1 HEAD | grep nginx 无输出时，可跳过下面几行
sudo cp /var/www/b2b-independent-site/b2b-independent-site.nginx.conf /etc/nginx/sites-available/b2b-independent-site
sudo sed -i 's/your-domain.com/commoditychina.com/g' /etc/nginx/sites-available/b2b-independent-site
# 必须先建缓存父目录：nginx 不会自动创建 /var/cache/nginx，缺它会报
#   mkdir() "/var/cache/nginx/b2b" failed (2: No such file or directory)
sudo mkdir -p /var/cache/nginx/b2b /var/cache/nginx/b2b_img
sudo chown -R www-data:www-data /var/cache/nginx
sudo nginx -t && sudo systemctl reload nginx
```

> **⚠️ 上传文件目录**：`ecosystem.config.js` 已把 `UPLOAD_DIR` 固定到项目根目录 `./uploads/`（可靠持久化，不随构建清空）。
>
> - 即便 `UPLOAD_DIR` 没生效，代码也会自动把上传目录解析到 `<项目根>/uploads/`（见 `src/lib/uploads.ts`），**不再依赖 PM2 环境变量**，所以 `pm2 restart` / `pm2 startOrReload` 都不会再丢图。
> - 若此前版本把上传文件存在 `.next/standalone/uploads`，重新部署前请迁移一次（否则旧文件会被构建清空，只能后台重新上传）：
>   ```bash
>   pm2 stop b2b-independent-site
>   mkdir -p /var/www/b2b-independent-site/uploads
>   [ -d .next/standalone/uploads ] && mv -f .next/standalone/uploads/* /var/www/b2b-independent-site/uploads/
>   pm2 startOrReload ecosystem.config.js
>   ```
>
> **⚠️ PM2 环境变量只在「首次创建进程」时生效**：若当前运行的 `b2b-independent-site` 进程是在旧配置（没有 UPLOAD_DIR）下启动的，之后无论 `pm2 restart` 还是 `pm2 startOrReload` 都**不会**把新的 `UPLOAD_DIR` 注入进程（PM2 复用旧 env）。新代码已不依赖该环境变量，但为了拿到更清晰的目录并强行纠正一次，建议一次性重建进程：
>
> ```bash
> pm2 delete b2b-independent-site
> pm2 startOrReload ecosystem.config.js
> pm2 save
> ```
>
> 之后正常升级沿用 `pm2 startOrReload ecosystem.config.js`（不要用 `pm2 restart b2b-independent-site`，避免与脚本期望不一致）。

> **⚠️ 若本次更新修改了 nginx 模板（如 `b2b-independent-site.nginx.conf`，本次即增加了代理超时与开机自启相关调整），需要重新部署模板并重载**（每次都执行一次也没成本）：
>
> ```bash
> # 从仓库重新复制模板，并把域名替换成你的（示例：commoditychina.com）
> sudo cp /var/www/b2b-independent-site/b2b-independent-site.nginx.conf /etc/nginx/sites-available/b2b-independent-site
> sudo sed -i 's/your-domain.com/commoditychina.com/g' /etc/nginx/sites-available/b2b-independent-site
>
> # 必须先创建缓存父目录（模板里的 proxy_cache_path 需要它）：
> #   缺这一步会报 mkdir() "/var/cache/nginx/b2b" failed (2: No such file or directory)
> sudo mkdir -p /var/cache/nginx/b2b /var/cache/nginx/b2b_img
> sudo chown -R www-data:www-data /var/cache/nginx
>
> sudo nginx -t && sudo systemctl reload nginx
> ```
>
> 不要直接在服务器上改动模板里的域名占位为新域名后保存——复制过来的文件会被下次 `git pull` 覆盖。
>
> **服务器重启后若报同样的 mkdir 错误**：Ubuntu 的 `/etc/tmpfiles.d/` 会在重启时清空 `/var/cache/nginx`，重跑上面那两行 `mkdir -p` + `chown` 即可（可写进 crontab @reboot 自动化）。

### 11.1 开机自启（服务器重启后自动恢复网站，必须配置一次）

Nginx、PostgreSQL 已在第 2 节用 `systemctl enable` 设成开机自启。还要把 **Node 应用（PM2）** 也注册成开机自启，否则云服务器一旦重启，Node 不会跟着起来，这时候 nginx 反代不到后端就会返回 **502 / 504**：

```bash
# 1. 确认三个系统服务开机自启（应输出 enabled）
systemctl is-enabled postgresql nginx redis-server

# 2. 注册 PM2 开机自启（把 pm2 startup 输出的那一行 systemd 命令复制执行一次）
pm2 startup

# 3. 固化当前 PM2 进程列表（每次 restart 后都要重新保存）
pm2 save

# 4. 确认已注册
systemctl list-unit-files | grep pm2    # 应看到 pm2-root.service enabled

# 5.（可选）整机重启验证一次
reboot
# 重启后：
curl http://localhost:3000/api/health   # 应直接返回 {"status":"ok"...}
curl -I https://commoditychina.com      # 应直接返回 HTTP/2 200
```

> 已能正常打开网页 ≠ 已配好开机自启。请务必执行上面步骤，否则下次服务器重启后又会出现 504/502。

可打包成一键脚本：

```bash
cat > /usr/local/bin/deploy.sh << 'EOF'
#!/bin/bash
set -e
cd /var/www/b2b-independent-site
git pull origin main
npm ci --legacy-peer-deps
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build:server
pm2 startOrReload ecosystem.config.js
pm2 save
echo "Deployment complete!"
EOF
chmod +x /usr/local/bin/deploy.sh
```

---

## 12. 运维命令

```bash
pm2 status                                  # 进程状态
pm2 logs b2b-independent-site --lines 100   # 最近日志
pm2 restart b2b-independent-site            # 重启
pm2 stop b2b-independent-site               # 停止
pm2 monit                                   # 实时监控
pm2 startup && pm2 save                     # 开机自启

# 日志文件
tail -f /var/www/b2b-independent-site/logs/out.log
tail -f /var/www/b2b-independent-site/logs/err.log

# 数据库备份
pg_dump -U commerce_user commerce_db > /backup/b2b-independent-site-$(date +%Y%m%d).sql
```

> 完整监控、备份、安全 checklist 见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

---

## 13. 故障排查

| 现象 | 排查 |
|------|------|
| `pm2 status` 为 `errored` | `pm2 logs b2b-independent-site --lines 50` |
| `Script not found: .../standalone/server.js` | 没执行第 5 节构建。先 `npm run build:server` 再启动 |
| 迁移报 `table does not exist` | 迁移/种子顺序反了，或旧迁移残留，按第 6 节重置空库 |
| `npm install` 报 ERESOLVE | 必须 `npm ci --legacy-peer-deps` |
| 502 Bad Gateway | `curl http://localhost:3000/api/health`；`sudo nginx -t` |
| 504 Gateway Time-out | ① 确认 nginx 模板已按**第 8 节/11 节**重新部署（`/api` 已放宽到 360s）；② `curl http://localhost:3000/api/health` + `pm2 status`：若 app 反复重启 / restart 次数暴涨，多半是 `max_memory_restart` 太低被瞬时峰值误杀（首页全动态 SSR + 首次访问的图像优化内存飙升）——已把 `ecosystem.config.js` 调到 2G 堆、2G 重启阈值，确认服务器按新版重启过；小内存机器按该文件注释下调；③ 部署后首次打开很慢属正常（图像优化缓存是冷的），可先访问一次首页预热；④ 刚重启过机器而 Node 没起来时见第 11.1 节开机自启 |
| `[PM2][ERROR] Process with pid X already exists` | PM2 开机自启恢复时记录的 pid 文件过期/复用（重启后常见）。清理后重新注册：`pm2 kill` → `pkill -f ".next/standalone/server.js"` → 确认 `curl http://localhost:3000/api/health` 无响应 → `pm2 delete b2b-independent-site; pm2 start ecosystem.config.js --update-env; pm2 save` → `pm2 status` 应为 online |
| 服务器重启后网页 502/504 打不开 | 开机自启未配置：`systemctl is-enabled postgresql nginx` 应输出 enabled；`pm2 startup` + `pm2 save` 重新注册；`reboot` 后用 `curl http://localhost:3000/api/health` 验证 |
| `nginx -t` 报证书不存在 | 先跑第 9 节 certbot |
| `nginx -t` 报 `mkdir() "/var/cache/nginx/b2b" failed (2: No such file or directory)` | 模板里的 `proxy_cache_path` 需要父目录 `/var/cache/nginx`，而 nginx 只会自动创建末级目录。执行 `sudo mkdir -p /var/cache/nginx/b2b /var/cache/nginx/b2b_img && sudo chown -R www-data:www-data /var/cache/nginx` 后重新 `nginx -t && systemctl reload nginx`。**服务器重启后易复发**（Ubuntu `/etc/tmpfiles.d/` 会清空该目录），可写进 `crontab @reboot` 自动化 |
| 重新部署后首页第一张图 / 产品主图丢失 | 见第 11 节「上传文件目录」：① 一次性 `pm2 delete b2b-independent-site` 后 `pm2 startOrReload ecosystem.config.js` 重建进程；② 确认 `ls /var/www/b2b-independent-site/uploads` 里有文件；③ 若旧文件此前存在 `.next/standalone/uploads` 且已被构建清空，只能到管理后台重新上传。新代码（`src/lib/uploads.ts`）已自动把上传目录固定到项目根 `uploads/`，重建不会再丢 |
| OOM 构建失败 | 加 swap（第 1.1 节） |

---

## 14. 通用参考（支付/邮件/SEO/管理后台）

以下内容与部署方式无关，部署完成后按需配置，请看 [DEPLOYMENT.md](./DEPLOYMENT.md)：

- 环境变量完整说明
- Stripe / PayPal 支付配置
- Gmail SMTP 邮件
- 管理后台初始化与登录
- 数据库备份 / 监控 / 安全 checklist
- SEO / GEO / CDN 优化
- CI/CD 自动部署