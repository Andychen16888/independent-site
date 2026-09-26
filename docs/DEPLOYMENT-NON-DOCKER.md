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
   - [1.2 一整段可粘贴的加固流程](#12-安全加固部署前必须完成)　← **新服务器从这里开始**
   - [1.2.1 验证与自检](#121-验证与自检做完必查)
   - [1.2.2 救援：万一被锁在外面](#122-救援万一被锁在外面)
   - [1.2.3 日常查看](#123-日常查看)
   - [1.2.4 可选：改用 SSH 密钥登录](#124-可选改用-ssh-密钥登录)
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

> 🚨 服务器疑似被入侵（挖矿程序 / 后门账号 / CPU 满载）？不要在原机上修，
> 直接看 [服务器被入侵后的恢复清单](./INCIDENT-RECOVERY.md)。

---

## 1. 服务器准备与安全加固

### 1.1 最低配置

| 配置项 | 最低 | 推荐 |
|--------|------|------|
| CPU | 1 核 | 2 核 |
| 内存 | 2 GB（建议加 2G swap） | 4 GB |
| 硬盘 | 20 GB SSD | 40 GB SSD |
| 系统 | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |

> 1 核 2G 小机器**必须**先加 swap，防止 `next build` 时 OOM。
> 具体命令见 [§1.2 安全加固](#12-安全加固部署前必须完成) 的第 6 步（那里是一整段可直接粘贴的流程）。
> Ubuntu 22.04 也验证可用，但 PostgreSQL 需自行加 PGDG 源（§2 已含该步骤）。

### 1.2 安全加固（部署前必须完成）

> **原则**：新服务器在完成加固前，暴露时间越短越好。以下步骤在安装任何依赖 / 克隆代码**之前**完成。
>
> 本节是**一整段可直接粘贴执行**的加固流程（PuTTY / 密码登录 + SSH 端口改 2222）。
> 想改用 SSH 密钥登录见 [1.2.4 可选：改用密钥登录](#124-可选改用-ssh-密钥登录)。

```bash
# ============================================================
# 0. 更新系统 + 基础工具
# ============================================================
apt update && apt upgrade -y
apt install -y curl wget git vim fail2ban unattended-upgrades
systemctl enable --now fail2ban
systemctl enable --now unattended-upgrades

# ============================================================
# 1. 设置强密码（不要用 Vultr 默认密码，不要与其它服务复用）
# ============================================================
passwd root

# ============================================================
# 2. fail2ban 防爆破（SSH 失败 3 次 → 封 24 小时 → 由 UFW 执行封禁）
#    banaction = ufw 是关键：缺了它 fail2ban 会直接改 iptables，
#    与 ufw 打架，且一旦执行 ufw reload 封禁记录就被清空。
# ============================================================
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime   = 24h
findtime  = 10m
maxretry  = 3
backend   = systemd
banaction = ufw

[sshd]
enabled   = true
# 若改了 SSH 端口（下面第 3 步改成 2222），取消注释并填实际端口。
# backend = systemd 时日志来自 journald、按 _SYSTEMD_UNIT=sshd.service 匹配，
# 与端口无关，所以这一行填错也不会导致漏封，仅为语义清晰。
# port      = 2222
EOF
systemctl restart fail2ban
sleep 3

# 校验（全部使用全版本通用的命令）
systemctl is-active fail2ban                # 期望：active
fail2ban-client status sshd                 # 期望：Status for the jail: sshd
# 确认 fail2ban 实际加载到的关键参数（不依赖 fail2ban-client get，该命令仅新版本可用）
fail2ban-client show sshd | tr ',' '\n' | grep -iE '"?(banaction|maxretry|bantime|backend)"?'

# ============================================================
# 3. 改 SSH 端口 22 → 2222
#    全网自动爆破脚本绝大多数只扫 22，改端口是性价比最高的一步。
# ============================================================
sed -i 's/^#\?Port .*/Port 2222/' /etc/ssh/sshd_config
grep -n '^Port' /etc/ssh/sshd_config       # 期望：Port 2222

# ============================================================
# 4. 防火墙 UFW
#    · 先把 2222 放进去，再 enable，避免把自己挡在外面
#    · ICMP 不需要手动加：ufw 命令行不支持 ICMP 规则
#      （`ufw allow proto icmp` 会报 ERROR: Need 'to' or 'from' clause），
#      而 /etc/ufw/before.rules 默认已放行 echo-request（可被 ping）、
#      destination-unreachable（PMTU，防大响应卡死）等关键类型。
#    · 想改成「出站不限制」，把 deny outgoing 换成 allow outgoing 即可。
# ============================================================
ufw --force reset
ufw default deny incoming
ufw default deny outgoing
ufw allow in on lo
ufw allow out on lo

# 入站：SSH(新端口) / HTTP / HTTPS
ufw allow in 2222/tcp
ufw allow in 80/tcp
ufw allow in 443/tcp

# 出站：git(22) / DNS(53) / npm·Stripe·PayPal·OpenAI·Let's Encrypt(80,443) / NTP(123) / SMTP(25,465,587)
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
# 期望：Default: deny (incoming), deny (outgoing), disabled (routed)
#       2222/tcp ALLOW IN · 80/tcp ALLOW IN · 443/tcp ALLOW IN

# ============================================================
# 5. 重载 sshd
# ============================================================
systemctl reload sshd
sshd -T | grep -E '^port|passwordauthentication'
# 期望：port 2222
#       passwordauthentication yes

# ============================================================
# 6. 加 2G swap（2GB 内存机器必做，否则 next build 会 OOM）
# ============================================================
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
free -h
```

#### 1.2.1 验证与自检（做完必查）

> ★★★ **当前这个 PuTTY 会话不要关！** 下面第 1 项验证通过之前，关掉就可能再也连不上。

1. **另开一个 PuTTY 窗口**，把 `Session → Port` 改成 **2222**，用第 1 步设的密码登录
2. 登录成功后在新窗口里复核：

```bash
systemctl is-active fail2ban                # 期望：active
fail2ban-client status sshd                 # 期望：Status for the jail: sshd
ufw status verbose | head -8
ss -tlnp | grep 2222          # 期望：LISTEN ... :2222
free -h                        # 期望：Swap 一行有内容
```

> 想确认 fail2ban 真的会自动封禁，可以做一次**安全自测**：另开一个窗口用
> `ssh -p 2222 root@你的IP` 连续输错密码 4 次，然后用第三个窗口执行
> `fail2ban-client status sshd`，应能看到 `Currently banned: 1`；
> 同时 `ufw status numbered | grep -i f2b` 会出现对应的 F2B 封禁规则。
> 测完记得解封：`fail2ban-client set sshd unbanip 你的本机IP`

3. 全部正常后，**才可以**关闭旧的那个 22 端口会话

自检清单：

- [ ] 新 PuTTY 会话（端口 2222）能登录
- [ ] `fail2ban-client show sshd` 输出里的 `banaction` 为 `ufw`（不要用
      `fail2ban-client get sshd banaction`，该子命令仅新版本 fail2ban 才有）
- [ ] `ufw status` 里 2222/80/443 都是 ALLOW IN
- [ ] `ss -tlnp | grep 2222` 有 LISTEN
- [ ] `free -h` 里 Swap 已启用
- [ ] 以上都通过，才关闭旧会话

#### 1.2.2 救援：万一被锁在外面

Vultr 控制台 → 该实例 → **View Console**（网页 VNC，可用密码直接登录，不依赖 SSH）。
进去后恢复：

```bash
sed -i 's/^#\?Port .*/Port 22/' /etc/ssh/sshd_config
ufw allow 22/tcp
ufw --force enable
systemctl reload sshd
```

> VNC 这条通道一定要留着，它是 SSH 配置坏掉时唯一的救命入口。

#### 1.2.3 日常查看

```bash
fail2ban-client status sshd              # 当前封禁了哪些 IP
tail -50 /var/log/fail2ban.log           # 爆破记录
ufw status numbered | grep -i f2b        # 封禁是否已进 ufw 规则
```

#### 1.2.4 可选：改用 SSH 密钥登录

安全性更高（可关闭密码登录），适合多设备或需要脚本免密登录。**只需两条命令**：

```bash
# 1）在【本地 Windows PowerShell】执行，没有密钥对就先生成
ssh-keygen -t ed25519 -C "b2b-server"
ssh-copy-id -i $env:USERPROFILE\.ssh\id_ed25519.pub root@your-server-ip
#    Windows 10+ 自带 OpenSSH，无需装 PuTTY 插件；也可手工把公钥内容粘到
#    服务器的 /root/.ssh/authorized_keys

# 2）确认能免密登录后，在服务器上关闭密码登录
ssh -o PreferredAuthentications=publickey -o PasswordAuthentication=no root@your-server-ip
```

```bash
# 3）服务器上关闭密码登录（务必先确认第 1 步能连上）
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
systemctl reload sshd
sshd -T | grep -E 'pubkeyauthentication|passwordauthentication'
# 期望：pubkeyauthentication yes / passwordauthentication no
```

之后连接用 `ssh root@your-server-ip`（若保留 2222 端口则加 `-p 2222`），无需密码。


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

在 psql 里执行（**库名/角色名与 [`.env.example`](../.env.example) 保持一致**，后续 `.env` 的
`DATABASE_URL` 也要对应；密码请换成自己新生成的强密码）：

```sql
CREATE USER b2b_user WITH PASSWORD 'your-strong-password';
CREATE DATABASE b2b_independent_site OWNER b2b_user;
GRANT ALL PRIVILEGES ON DATABASE b2b_independent_site TO b2b_user;
\c b2b_independent_site
GRANT ALL ON SCHEMA public TO b2b_user;
\q
```

> 生成强密码：`openssl rand -base64 24`
>
> 数据库只需本地访问，**不要**开启远程连接（`listen_addresses` 保持 `localhost`）。
> 确认端口没有暴露到公网：`ss -tlnp | grep 5432`，期望只看到 `127.0.0.1:5432`。

---

## 4. 获取代码与环境变量

```bash
cd /var/www
git clone https://github.com/Andychen16888/B2B-Independent-Site.git

# ⚠️ 必须重命名：仓库名是 B2B-Independent-Site（大写 B2B），
#    而本教程后续所有命令、Nginx 模板里的绝对路径都按小写 b2b-independent-site 写。
#    Linux 区分大小写，不改的话后面每条 cd 都会报 "No such file or directory"。
mv B2B-Independent-Site b2b-independent-site

chown -R root:root b2b-independent-site
cd b2b-independent-site

# 确认路径与属主都正确（必须是小写 b2b-）
ls -ld /var/www/b2b-independent-site        # 期望：drwxr-xr-x ... root root ... b2b-independent-site
```

> **为什么全篇用小写**：仓库名带大写 `B2B`，`git clone` 出来的目录就是大写；
> 但 Nginx 模板（`b2b-independent-site.nginx.conf`）里 `root` / `alias` / `proxy_cache_path`
> 等多处硬编码了 `/var/www/b2b-independent-site`，日志、备份、运维命令也统一用小写。
> 统一成小写一处改到底，比在几十处命令里反复区分大小写可靠得多。
>
> **为什么属主是 `root:root`**：本教程全程 root 部署，`ecosystem.config.js` 里的
> `pm2` 也以 root 运行（`pm2 startup systemd -u root`），应用需要**写**权限到
> `uploads/`、`logs/`、`.next/`，因此属主必须是 root。
> Nginx 以 `www-data` 运行，只需**读**静态文件，默认 `755` 权限已足够，无需改成 www-data。
> 若你改成用非 root 用户跑 PM2，则需同步调整 `ecosystem.config.js` 属主，并确认该用户
> 对 `uploads/` `logs/` `.next/` 有写权限。
>
> 已克隆成大写目录、且不想重命名？也可以就地改用大写路径，但必须同时改：
> Nginx 模板内所有 `/var/www/b2b-independent-site`、以及后续命令里的路径 —— 极易漏改，不推荐。

创建 `.env`：

```bash
cd /var/www/b2b-independent-site
cp .env.example .env
nano .env
```

**必填项**（其余可留空）：

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://b2b_user:密码@localhost:5432/b2b_independent_site?schema=public` |
| `NEXTAUTH_SECRET` | 随机密钥 | `openssl rand -base64 32` 生成 |
| `NEXTAUTH_URL` | 站点 https 地址 | `https://commoditychina.com` |
| `NEXT_PUBLIC_SITE_URL` | 同站点地址 | `https://commoditychina.com` |
| `NEXT_PUBLIC_SITE_NAME` | 站点名 | `Commodities From China` |

> ⚠️ **`.env` 里的 `DATABASE_URL` 不能被 `#` 注释掉**。项目使用 `prisma.config.ts`，
> Prisma 6 检测到它就**不再自动加载 `.env`**（会打印
> `Prisma config detected, skipping environment variable loading`），
> 改由该文件负责注入。若这一行被注释或缺失，`npm run db:migrate` 会报：
> ```
> Error code: P1012
> error: Environment variable not found: DATABASE_URL.
> ```
> 现在 `db:migrate` / `db:seed` / `db:push` 前置了检查脚本，会直接告诉你怎么修。
> 自行确认：
> ```bash
> grep '^DATABASE_URL' .env        # 必须有输出，且行首不是 #
> ```
> 注：`prisma generate` 与 `next build` 不需要连库，所以 `.env` 缺失时构建仍会成功（只打印警告）——
> **不要因此以为 `.env` 没问题**，紧接着的 `db:migrate` 就会失败。

> `.env` 里**不要**填写 `UPLOAD_DIR`：`ecosystem.config.js` 已把它固定到项目根目录的
> `uploads/`，填错会让上传的图片在下次 `next build` 后全部丢失。
>
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
> - `next build` 时若 OOM，脚本已内置 `NODE_OPTIONS=--max-old-space-size=4096`；1 核 2G 机器请先加 swap（见 [§1.2 第 6 步](#12-安全加固部署前必须完成)）。
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

> 顺序不能错**：先 `db:migrate` 再 `db:seed`，否则 seed 报 `table does not exist`。
>
> ⚠️ **`db:seed` 会写入页面 / 博客 / FAQ / 导航 / 站点设置的初始值，覆盖你在后台改过的内容。**
> 从旧服务器迁移（已有备份 dump）时**不要跑 `db:seed`**，改用下面的「方式 B」。
>
> **方式 A：全新空库（第一次部署）** —— 用上面那两条命令（`db:migrate` → `db:seed`）。
> 种子会创建管理员账号 `81570423@qq.com` / `Admin123!`，**上线后立刻在后台改掉密码**。
>
> **方式 B：从备份恢复（迁移旧服务器，推荐）** —— 跳过 `db:seed`：
> ```bash
> cd /var/www/b2b-independent-site
>
> # 恢复整库备份（dump 里已含商品、站点设置、图片槽位、你在后台的所有改动）
> sudo -u postgres pg_restore -U postgres -d b2b_independent_site \
>   --no-owner --role=b2b_user /root/incident/db.dump
>
> # 迁移是幂等的，跑一次确保 schema 与代码一致（已应用的自动跳过）
> npm run db:migrate
>
> # 恢复用户上传的图片（必须在 pm2 start 之前）
> tar xzf /root/incident/uploads.tar.gz
> ls -la uploads/ public/images/ public/uploads/ 2>/dev/null
> ```
> 备份怎么做的见 [INCIDENT-RECOVERY.md §2 抢救数据](./INCIDENT-RECOVERY.md#2-阶段二抢救数据只救数据不救程序)。
> **图片必须和数据库一起恢复** —— 磁盘上是 `uploads/` 里的文件，槽位配置在数据库 `images` 表，
> 只恢复其一会导致「文件在但前台不显示」。
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
> sudo -u postgres psql -d postgres -c 'DROP DATABASE IF EXISTS b2b_independent_site;'
> sudo -u postgres psql -d postgres -c "CREATE DATABASE b2b_independent_site OWNER b2b_user;"
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

# 断言：模板里的项目路径必须真实存在（大小写不一致时 nginx -t 不会报错，
# 但运行期会 404/502，非常隐蔽）。目录名对不上时先回 §4 重命名。
grep -o '/var/www/[^ /;]*' /etc/nginx/sites-available/b2b-independent-site | sort -u | while read -r p; do
  [ -e "$p" ] && echo "OK   $p" || echo "缺失 $p  ← 目录名大小写或路径不对"
done

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

**5. 图片缓存是否真的生效**（省 CPU 的关键，必须确认）：

```bash
# 找一个已上传商品的图片 URL
IMG=$(grep -oP 'https://[^"]*uploads/[^"]*' public/uploads/*.json 2>/dev/null | head -1)
# 或直接从浏览器复制任意商品图地址后：
# curl -sI -H 'Accept: image/webp' "https://commoditychina.com/实际图片路径" | grep -iE 'X-Cache-Status|Hit'

# 首次 MISS、上传后重复请求应 HIT，且 30 天内不再回源
curl -sI "https://commoditychina.com/实际图片路径" | grep -i X-Cache-Status   # 期望 HIT
```

> 始终 `MISS` 说明磁盘缓存没写入或缓存目录被清空，见 §8 的 `mkdir -p /var/cache/nginx/b2b_img`。
> `X-Cache-Status` 若是 `EXPIRED`，说明命中但已过新鲜期，会回源更新一次，仍算正常。

**6. 管理后台监控页**（`/admin/monitoring`）：

- 4 张卡片（CPU / 内存 / 存储 / 磁盘）状态应为绿色
- **Top Processes 进程 CPU 占用**应有数据；空白仅发生在首次打开的那一次采样，
  刷新（30 秒）后会出现 —— 若持续空白才是异常
- 磁盘占用应显示项目根目录路径，不是 `.next/standalone`

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

# 数据库备份（迁移到新服务器时用自定义格式 -Fc，恢复更完整）
mkdir -p /backup
pg_dump -U b2b_user -Fc b2b_independent_site > /backup/b2b-$(date +%Y%m%d).dump

# 恢复
sudo -u postgres pg_restore -U postgres -d b2b_independent_site --no-owner --role=b2b_user /backup/b2b-YYYYMMDD.dump

# 上传的图片必须一起备份，否则前台商品图全部 404
tar czf /backup/uploads-$(date +%Y%m%d).tar.gz -C /var/www/b2b-independent-site uploads
```

> `.env` 里的 `DATABASE_URL` 也要一起备份（`cp .env /backup/env-$(date +%Y%m%d)`），
> 新机部署时需要它里面的 `NEXTAUTH_SECRET` 才能让已登录会话和 OAuth 回调继续有效。

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