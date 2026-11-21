# 新机零起点重建清单（含入侵后重装）

> 用途：服务器被入侵后，在**全新服务器**上从 0 到站点上线的**一条线照做清单**。
> 合并自 [DEPLOYMENT.md](./通用独立站%20DEPLOYMENT.md) 与 [INCIDENT-RECOVERY.md](./INCIDENT-RECOVERY.md)，
> 两者仍是权威细节来源，本文件只是按执行顺序拼成可勾选的流程。
>
> **占位符（全程替换）**：`your-domain.com` = 你的主域名；`www.your-domain.com` = 你的 www 域名；
> `Your Company` = 你的公司名称；`admin@example.com` = 你的管理员邮箱；
> `b2b_independent_site` = 库名；`b2b_user` = 数据库角色；
> `/var/www/b2b-independent-site` = 项目目录（小写）。
>
> `your-domain.com` 只是占位符，不是任何真实公司的域名；命令、证书路径、验证地址都要换成你自己的域名。
> 站点名称和首页内容可在上线后到 `/admin/settings` 修改。
>
> **原则**：数据可以救，机器必须重装。旧机上的任何程序、脚本、二进制**一律不要带过来**。
>
> **数据恢复走哪条路**：默认用**后台自带的备份 zip**（`/admin/backup` → 下载备份），
> 重装后在后台恢复即可，无需 `pg_dump`。仅当站点**已有真实订单/客户**时，才需要额外做一次
> `pg_dump` 兜底（见阶段 0 对照表）。

---

## 阶段 0 · 本地准备（备份 + 新凭据）

- [ ] **确认已下载后台备份**：登录 `https://your-domain.com/admin/backup` → 「下载备份」，
      得到 `backup-*.zip`，移到安全位置保存（它包含内容 + 已上传图片）
- [ ] 对照下表确认是否还需要额外 `pg_dump`：

| 后台备份**包含** | 后台备份**不包含** |
|------------------|--------------------|
| 分类 / 产品 / 产品图片、视频、参数、FAQ、关联 | 用户 / 管理员账号 |
| 页面 / 博客 / 站点 FAQ / 横幅 / 菜单 / 站点设置（含首页图片槽位） | 订单 / 订单项 |
| 已上传的图片文件 | 客户 / 优惠券 / 评论 / 订阅 / 联盟 / 分析数据 |

  - **刚建站、无真实订单/客户** → 后台 zip 即完整备份，**可跳过 `pg_dump`**。
  - **已有真实订单/客户** → 上述右侧数据会丢，**必须**额外 `pg_dump` 兜底
    （做法见 `INCIDENT-RECOVERY.md §2`，本地留好 `db.dump`）。
- [ ] 生成本机新 SSH 密钥对：`ssh-keygen -t ed25519 -C "b2b-new"`
- [ ] Vultr 后台：重置 root 密码、写入**新**公钥、作废旧密钥、开启 2FA
- [ ] 按 `INCIDENT-RECOVERY.md §3` 轮换**全部**凭据（新值先记在密码管理器里）：

| # | 凭据 | 动作 |
|---|------|------|
| 1 | Vultr | 改密码 / 换密钥 / 2FA / 撤销旧 API token |
| 2 | SSH 密钥 | 只放新公钥 |
| 3 | GitHub PAT / Deploy Key | 全部撤销，审计是否被投毒 |
| 4 | PostgreSQL | 新密码（阶段 3 用） |
| 5 | `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| 6 | Stripe | 新建 key + 换 webhook secret |
| 7 | PayPal | 重新生成 client secret |
| 8 | OpenAI | 新建 key，撤销旧的 |
| 9 | Gmail SMTP | 改应用专用密码 |
| 10 | Google / Apple OAuth | 轮换 client secret |
| 11 | Resend / 17Track / UploadThing | 逐个重建 |

- [ ] **销毁旧服务器**（Vultr → Destroy / 重建 Ubuntu 24.04 LTS 全新系统盘），备份 zip 已确认在手

---

## 阶段 1 · 新机加固（装任何东西之前，DEPLOYMENT §1.2）

```bash
# 0. 更新系统 + 基础工具
apt update && apt upgrade -y
apt install -y curl wget git vim fail2ban unattended-upgrades
systemctl enable --now fail2ban
systemctl enable --now unattended-upgrades

# 1. 设置强密码（不要用 Vultr 默认密码）
passwd root

# 2. fail2ban 防爆破（失败 3 次 → 封 24h → 由 UFW 执行）
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime   = 24h
findtime  = 10m
maxretry  = 3
backend   = systemd
banaction = ufw

[sshd]
enabled   = true
port      = 22
EOF
systemctl restart fail2ban
sleep 3
systemctl is-active fail2ban
fail2ban-client status sshd
# 不要用可能不存在的 `fail2ban-client get`，用全版本通用命令校验 banaction
fail2ban-client show sshd | tr ',' '\n' | grep -i banaction

# 3. SSH 端口：保持默认 22（本次不改端口）
grep -n '^Port' /etc/ssh/sshd_config || echo "沿用默认端口 22"

# 4. 防火墙 UFW（先把 SSH/80/443 放进去再 enable）
ufw --force reset
ufw default deny incoming
ufw default deny outgoing
ufw allow in on lo
ufw allow out on lo
ufw allow in 22/tcp
ufw allow in 80/tcp
ufw allow in 443/tcp
ufw allow out 22/tcp
ufw allow out 53/udp
ufw allow out 53/tcp
ufw allow out 80/tcp
ufw allow out 443/tcp
ufw allow out 123/udp
ufw allow out 587/tcp
ufw allow out 465/tcp
ufw allow out 25/tcp
ufw --force enable
ufw status verbose

# 5. 重载 sshd
systemctl reload sshd
sshd -T | grep -E '^port|passwordauthentication'

# 6. 加 2G swap（2G 内存机器 next build 必做，否则 OOM）
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
free -h
```

- [ ] 另开 PuTTY 窗口，默认端口 22 + 密码能登录（当前会话先别关）
- [ ] `ufw status` 里 22/80/443 均为 ALLOW IN；`free -h` Swap 已启用

**可选（推荐）：改用密钥登录**——确认新公钥能免密登录后，执行 `通用独立站 DEPLOYMENT.md §1.2.4`，
关闭 `PasswordAuthentication`（`sshd -T` 期望 `passwordauthentication no`）。

---

## 阶段 2 · 安装依赖（DEPLOYMENT §2）

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v          # v20.x

# PostgreSQL 16（PGDG 源）
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt update
sudo apt install -y postgresql-16
sudo systemctl enable --now postgresql

# Nginx
sudo apt install -y nginx
sudo systemctl enable --now nginx

# PM2 + Redis
sudo npm install -g pm2
sudo apt install -y redis-server
sudo systemctl enable --now redis-server
```

- [ ] **不安装 Docker**（本次入侵攻击者正是滥用 dockerd 拉起矿工容器）

---

## 阶段 3 · 建库建角色（DEPLOYMENT §3，用**新**密码）

```bash
sudo -u postgres psql
```

```sql
CREATE USER b2b_user WITH PASSWORD '新强密码';
CREATE DATABASE b2b_independent_site OWNER b2b_user;
GRANT ALL PRIVILEGES ON DATABASE b2b_independent_site TO b2b_user;
\c b2b_independent_site
GRANT ALL ON SCHEMA public TO b2b_user;
\q
```

- [ ] 生成强密码：`openssl rand -base64 24`
- [ ] `ss -tlnp | grep 5432` 只看到 `127.0.0.1:5432`

---

## 阶段 4 · 拉代码 + 配置 `.env`（DEPLOYMENT §4）

先**生成必需的密钥**再写入 `.env`：

```bash
# 生成数据库密码和 NextAuth Secret
echo "DB_PWD=$(openssl rand -base64 24)"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
```

把上面生成的值复制备用。

```bash
cd /var/www
# 如果你 fork 了仓库，把下面的 URL 换成你自己的仓库地址
git clone https://github.com/Andychen16888/independent-site.git b2b-independent-site
chown -R root:root b2b-independent-site
cd b2b-independent-site
ls -ld /var/www/b2b-independent-site              # 期望 root root

cp .env.example .env
nano .env
```

按需修改以下几项（其余保持 `.env.example` 默认即可）：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | `postgresql://b2b_user:【DB_PWD】@localhost:5432/b2b_independent_site?schema=public` |
| `NEXTAUTH_SECRET` | `【NEXTAUTH_SECRET】` |
| `SEED_ADMIN_EMAIL` | `admin@example.com`（改成你自己的邮箱，仅首次建表生效） |
| `NEXTAUTH_URL` | `https://your-domain.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` |
| `NEXT_PUBLIC_SITE_NAME` | `Your Company`（构建期默认值，也可在 `/admin/settings` 改） |
| `SMTP_FROM` | `Your Company <no-reply@your-domain.com>` |

- [ ] `grep '^DATABASE_URL' .env` 有输出且行首不是 `#`
- [ ] `DATABASE_URL` 主机名是 `localhost`（不是 `db`）
- [ ] 不要填 `UPLOAD_DIR`（已固定到项目根 `uploads/`）

---

## 阶段 5 · 构建（DEPLOYMENT §5）

```bash
cd /var/www/b2b-independent-site
npm ci --legacy-peer-deps
npm run db:generate
npm run build:server

# 断言构建产物存在
test -f .next/standalone/server.js && echo "build ok, ready to start"
```

- [ ] 输出 `build ok, ready to start` 才能继续，否则重新构建

---

## 阶段 6 · 建表（空库）

```bash
cd /var/www/b2b-independent-site
npm run db:migrate
npm run db:seed            # 建管理员 SEED_ADMIN_EMAIL / Admin123!，上线后立刻改密码
```

- [ ] 可选：博客正文翻译 `npm run db:translate-blog`（需 `.env` 里 OPENAI_API_KEY）
- [ ] 等阶段 9 用**后台备份 zip** 恢复内容和图片，**不要在服务器上**用 `pg_restore`

---

## 阶段 7 · 启动应用 PM2（DEPLOYMENT §7）

```bash
cd /var/www/b2b-independent-site
test -f .next/standalone/server.js && echo "build ok, ready to start"
pm2 start ecosystem.config.js
pm2 save
pm2 startup                 # 复制它输出的那行 systemd 命令执行一次
pm2 status                  # b2b-independent-site = online
curl http://localhost:3000/api/health    # {"status":"ok",...}
```

- [ ] `systemctl list-unit-files | grep pm2` → `pm2-root.service enabled`

---

## 阶段 8 · Nginx + SSL 证书（DEPLOYMENT §8，顺序不能错）

```bash
# 8.1 先放 HTTP-only 引导配置
sudo tee /etc/nginx/sites-available/b2b-independent-site > /dev/null <<'EOF'
server {
  listen 80;
  server_name your-domain.com www.your-domain.com;
  location /.well-known/acme-challenge/ { root /var/www/b2b-independent-site/public; }
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 360s;
  }
}
EOF
sudo ln -sf /etc/nginx/sites-available/b2b-independent-site /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo mkdir -p /var/www/b2b-independent-site/public/.well-known/acme-challenge
sudo nginx -t && sudo systemctl reload nginx

# 8.2 申请证书
sudo apt install -y certbot
sudo certbot certonly --webroot -w /var/www/b2b-independent-site/public \
  -d your-domain.com -d www.your-domain.com \
  --email you@example.com --agree-tos --no-eff-email
sudo ls -l /etc/letsencrypt/live/your-domain.com/

# 8.3 启用完整模板（含 HTTPS + 缓存）
cd /var/www/b2b-independent-site
sudo mkdir -p /var/cache/nginx/b2b /var/cache/nginx/b2b_img
sudo chown -R www-data:www-data /var/cache/nginx
bash scripts/install-nginx-conf.sh your-domain.com

# 断言模板里的项目路径真实存在
grep -o '/var/www/[^ /;]*' /etc/nginx/sites-enabled/b2b-independent-site | sort -u | while read -r p; do
  [ -e "$p" ] && echo "OK   $p" || echo "缺失 $p  ← 目录名大小写或路径不对"
done
```

- [ ] `http://your-domain.com` 301 跳到 `https://`
- [ ] 证书 `sudo certbot renew --dry-run` 通过（systemd timer 自动续期）

---

## 阶段 9 · 恢复后台备份 + 初始化

- [ ] 浏览器打开 `https://your-domain.com/admin`，用 `.env` 中 `SEED_ADMIN_EMAIL` 的邮箱 / `Admin123!` 登录
- [ ] **立刻修改管理员密码**
- [ ] 进 **备份管理**（`/admin/backup`）→ 上传 `backup-*.zip` → 勾选**覆盖模式** → 「上传并恢复」
      - 上传上限 50MB（nginx `client_max_body_size`）；备份更大时先在服务器调高该值
      - 恢复后核对「产品 / 分类 / 页面 / 博客 / 已上传文件」计数与备份前一致
- [ ] `/admin/images` 抽查首页/产品图能正常显示（走 `/api/uploads/<file>`）
- [ ] 配置支付（Stripe/PayPal）、SMTP（Gmail）、OAuth 等第三方的**新**凭据
- [ ] 新机监听面确认 `ss -tlnp | grep -E ':(22|80|443|3000|5432|2375|6379)\b'`，仅 22/80/443 对公网

**（可选）入口复盘**：从旧机 `auth.log` 判定入侵入口（`INCIDENT-RECOVERY.md §6`）：

```bash
grep -E 'Accepted (publickey|password)' /root/incident/auth.log | awk '{print $1,$2,$3,$9,$11}' | sort -u
grep -c 'Failed password' /root/incident/auth.log
grep 'Accepted' /root/incident/auth.log | grep -v 'for root' || echo "无 root 以外的登录"
```

---

## 阶段 10 · 验收清单（INCIDENT-RECOVERY §7）

```bash
pm2 status                                   # online，重启次数 ↺ = 0
curl -s http://localhost:3000/api/health     # {"status":"ok",...}
ss -tlnp | grep -E ':(3000|5432)\b'          # 只 listen 127.0.0.1
curl -sI https://your-domain.com | head -1        # HTTP/2 200
curl -sI https://your-domain.com/api/health       # 200
curl -sI "https://your-domain.com/_next/image?url=%2Fapi%2Fuploads%2Fxxx.jpg&w=640&q=75" | grep -i X-Cache-Status

# 系统干净度
crontab -l                                   # 仅 nginx @reboot，无 amco_/pakchoi
ls -la /tmp                                  # 无 dashboard / 陌生 ELF
id pakchoi 2>&1 | head -1                    # no such user
top -bn1 | head -5                           # %Cpu(s) 个位数

# fail2ban 校验（显示当前状态）
fail2ban-client status sshd 2>&1 | head -8
```

- [ ] `/_next/image` 第二次请求 `X-Cache-Status: HIT`（CPU 优化生效）
- [ ] `/admin/monitoring` 全绿，**Top Processes** 只有正常进程
- [ ] 后台已用 `backup-*.zip` 恢复成功，内容（产品/分类/页面/博客/图片）与备份前一致
- [ ] `/admin/images` 和前台：首页 / 分类页 / 产品详情页 / 商品图片正常
- [ ] 后台登录正常、图片上传后前台立即可见
- [ ] 下单/支付走通（PayPal/Stripe 测试金额）
- [ ] **所有第三方凭据均已轮换，旧凭据确认失效**
- [ ] `certbot renew --dry-run` 通过
- [ ] 开机自启：`reboot` 后 `curl http://localhost:3000/api/health` 直接 ok

---

## 日常安全基线（每月）

```bash
crontab -l; for u in $(cut -d: -f1 /etc/passwd); do crontab -l -u "$u" 2>/dev/null | sed "s/^/[$u] /"; done
cat /etc/passwd | awk -F: '$3 == 0 || $3 >= 1000'
systemctl status unattended-upgrades
certbot renew --dry-run
pm2 save; systemctl list-unit-files | grep pm2
df -h /; free -h; pm2 monit
```

> `/admin/monitoring` 的 **Top Processes** 是发现异常进程最快的地方——本次事件若当时就有该
> 功能，第一眼就能看到 `dashboard` 吃满双核。每次部署后顺手扫一眼。

---

## 相关文档

- [DEPLOYMENT.md](./通用独立站%20DEPLOYMENT.md) —— 部署完整流程（PM2 + 系统 Nginx + PostgreSQL）
- [INCIDENT-RECOVERY.md](./INCIDENT-RECOVERY.md) —— 入侵后恢复与凭据轮换
- [OPERATIONS.md](./OPERATIONS.md) —— 运维、环境变量与第三方服务配置
