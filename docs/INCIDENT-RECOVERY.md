# 服务器被入侵后的恢复清单（Incident Recovery Runbook）

> **适用场景**：服务器 root 权限失陷（发现挖矿程序、后门账号、陌生二进制）。
>
> **核心原则**：**不要在失陷的机器上「修干净继续用」**。root 权限已失禁，无法证明没有
> rootkit / 内核模块 / 被替换的系统二进制。**数据可以救，机器必须重装。**

---

## 目录

- [0. 本次事件档案](#0-本次事件档案2026-09-26)
- [1. 阶段一：止血与取证](#1-阶段一止血与取证旧机器上做)
- [2. 阶段二：抢救数据](#2-阶段二抢救数据只救数据不救程序)
- [3. 阶段三：轮换全部凭据](#3-阶段三轮换全部凭据不依赖新机器立即做)
- [4. 阶段四：重装系统](#4-阶段四重装系统)
- [5. 阶段五：恢复站点](#5-阶段五恢复站点)
- [6. 阶段六：查清并封堵入侵入口](#6-阶段六查清并封堵入侵入口)
- [7. 阶段七：验收清单](#7-阶段七验收清单)
- [8. 日常安全基线](#8-日常安全基线)

---

## 0. 本次事件档案（2026-09-26）

| 项 | 内容 |
|----|------|
| 现象 | 监控页整机 CPU 100%（双核），`next-server` 仅 15% |
| 真凶 | `/tmp/dashboard`（ELF 64-bit statically linked, stripped, 8.3MB, SHA256 `b20f39fc…944b49`） |
| 启动方式 | `/tmp/dashboard --config /tmp/v.json`，`PPID 1`、`root`、`nice -15` |
| 矿池配置 | `v.json` 含 `api.worker-id: "nnjjss2"`、`background: true`、`autosave: true` |
| 工作目录 | `/var/www/b2b-independent-site/.next/standalone (deleted)`（重新部署后仍驻留） |
| 持久化 1 | root crontab：9 条 `*/30 * * * * docker start amco_<hex>` |
| 持久化 2 | root crontab：2 条 `*/30 * * * *` 创建用户 `pakchoi`（密码 `Kermit123@`）+ 写入 `/etc/sudoers.d/99-pakchoi`（NOPASSWD ALL） |
| 其它 | 服务器装有 `dockerd`，与 [DEPLOYMENT-NON-DOCKER.md](./DEPLOYMENT-NON-DOCKER.md) 的 PM2 方案无关，属额外攻击面 |
| 本站影响 | **代码库干净**（`git status` 无改动、全历史 `git log -S "v.json"` 为空、PM2 `cpu 0%`）。被篡改的只有系统层 |

**结论**：本站代码无需修补；损失的是服务器信任度与全部凭据。

---

## 1. 阶段一：止血与取证（旧机器上做）

> 在**卸载重装之前**执行。目的是把证据和数据保存下来，并确认入侵范围。

```bash
mkdir -p /root/incident

# 1.1 保存证据
crontab -l > /root/incident/root-cron.txt 2>/dev/null
cp /tmp/dashboard /root/incident/dashboard.bin 2>/dev/null
cp /tmp/v.json /root/incident/v.json 2>/dev/null
cp /var/log/auth.log /root/incident/auth.log 2>/dev/null
sha256sum /root/incident/dashboard.bin

# 1.2 查清范围：陌生账号 / 陌生计划任务 / 陌生 systemd 服务
cut -d: -f1,3 /etc/passwd | awk -F: '$2 >= 1000 || $1 == "pakchoi"'
ls -la /etc/sudoers.d/
for u in $(cut -d: -f1 /etc/passwd); do crontab -l -u "$u" 2>/dev/null | sed "s/^/[$u] /"; done
ls -la /etc/systemd/system/*.service /etc/systemd/system/*/*.service 2>/dev/null
grep -rlE 'amco|pakchoi|/tmp/dashboard' /etc/systemd /etc/init.d /etc/rc.local /root /home 2>/dev/null

# 1.3 查 SSH 公钥是否被塞入陌生 key
cat /root/.ssh/authorized_keys 2>/dev/null
for f in /root/.ssh/authorized_keys /home/*/.ssh/authorized_keys; do
  [ -f "$f" ] && echo "== $f ==" && cat "$f"
done

# 1.4 查 npm 依赖是否被劫持（攻击者常改 registry 拉后门包）
cat /root/.npmrc 2>/dev/null; cat ~/.npmrc 2>/dev/null
cd /var/www/b2b-independent-site && git status --short && git diff HEAD --stat
```

> **判读**：`/etc/passwd` 里除 `pakchoi` 外还有没有别的陌生用户；`authorized_keys` 里
> 每一条公钥都要能对上你本人的密钥对，不认识的**立刻删除**。

---

## 2. 阶段二：抢救数据（只救数据，不救程序）

> ⚠️ **绝不要**把 `node_modules/`、`.next/`、任何可执行文件从旧机器拷到新机器。
> 源机器不可信，拷贝本身就是传播途径。

```bash
# 2.1 取数据库名与角色（.env 是唯一准确来源，先记下来）
cd /var/www/b2b-independent-site
grep -E '^(DATABASE_URL|POSTGRES_USER|POSTGRES_DB)=' .env
# 示例：postgresql://b2b_user:xxxx@localhost:5432/b2b_independent_site?schema=public
#      → 库名 = b2b_independent_site，角色 = b2b_user

# 2.2 备份数据库（把 <DB_NAME> / <DB_USER> 换成上一步的实际值）
sudo -u postgres pg_dumpall > /root/incident/pg_dumpall.sql
sudo -u postgres pg_dump -Fc -U postgres <DB_NAME> > /root/incident/db.dump
sudo -u postgres pg_dumpall --globals-only > /root/incident/pg_globals.sql

# 2.3 备份用户上传的图片（上传目录在项目根，不在 .next 里，见 src/lib/uploads.ts）
cd /var/www/b2b-independent-site
tar czf /root/incident/uploads.tar.gz \
  uploads/ public/uploads/ public/images/ 2>/dev/null
ls -la uploads/ public/images/ 2>/dev/null | head -30

# 2.4 备份 .env（仅用于对照轮换凭据，轮换完即焚毁）
cp .env /root/incident/env.old

# 2.5 校验备份可用
ls -lh /root/incident/
pg_restore -l /root/incident/db.dump | head -20
tar tzf /root/incident/uploads.tar.gz | head -20
```

**站点图片说明**：Supply Chain / 首页等图片既存在 `uploads/`（磁盘文件），也存在数据库
`images` 表（槽位配置）。两者都要恢复，只拷 `uploads/` 会出现「图还在但前台不显示」。

**2.6 把备份拉出失陷机器**（在**本地**机器执行，不要留在服务器上）：

```bash
scp root@OLD_SERVER_IP:/root/incident/db.dump .
scp root@OLD_SERVER_IP:/root/incident/uploads.tar.gz .
scp root@<OLD_SERVER_IP>:/root/incident/root-cron.txt .
scp root@<OLD_SERVER_IP>:/root/incident/auth.log .
```

> 校验完 `db.dump` 可用后，**旧服务器即刻重装**，不要留任何数据。

---

## 3. 阶段三：轮换全部凭据（不依赖新机器，立即做）

> root 失陷 ⇒ 进程内读得到的一切密钥都视为已泄露。**先去平台后台 revoke/rotate，
> 再把新值写进新服务器的 `.env`**。顺序按影响面从大到小。

| # | 凭据 | 平台后台操作 | 影响 |
|---|------|-------------|------|
| 1 | **Vultr 控制台** | 重置 root 密码；新建 SSH 密钥对并禁用旧密钥；开启 2FA；若用过 API token 立即撤销 | 不做则新机器同样会被登入 |
| 2 | **SSH 密钥** | 本地 `ssh-keygen -t ed25519 -C "new-key"` 生成新对；新机器只放新公钥 | 旧的当众作废 |
| 3 | **GitHub PAT / Deploy Key** | Settings → Developer settings → 撤销全部 token；检查仓库 Audit Log 是否有陌生推送/webhook | 防止代码库被投毒 |
| 4 | **PostgreSQL 密码** | 新机器建库时用**新密码**（见阶段五） | 旧密码作废 |
| 5 | **`NEXTAUTH_SECRET`** | `openssl rand -base64 32` 重新生成 | 所有人被登出（预期效果） |
| 6 | **Stripe** | Dashboard 创建新 key，用 roll secret 流程换掉旧 key；检查 webhook 端点与事件记录 | 资金安全，最高优先级 |
| 7 | **PayPal** | Developer → 重新生成 client secret | 支付凭据 |
| 8 | **OpenAI** | 新建 API key，撤销旧的；检查 usage 有无异常 spike | 账单盗刷 |
| 9 | **Gmail SMTP** | 改应用专用密码 | 邮件被冒发 |
| 10 | **Google / Apple OAuth** | 轮换 client secret | 登录被劫持 |
| 11 | **Resend / 17Track / UploadThing** | 逐个重新生成 key | 其余第三方 |

> 变量清单见 [`.env.example`](../.env.example)；本次重装**不要**直接复用 `env.old`，
> 而是把上表轮换后的新值填进新的 `.env`。

---

## 4. 阶段四：重装系统

1. Vultr 控制台 → 该实例 → **Destroy / 重建**（或重装 Ubuntu 24.04 LTS 全新系统盘）
2. 生成并写入新 SSH 公钥（阶段三第 2 条）
3. 首次登录后**立刻**完成加固（在装任何东西之前）：

```bash
apt update && apt upgrade -y

# 1. 装基础工具 + fail2ban + 自动安全更新
apt install -y curl wget git vim fail2ban unattended-upgrades
systemctl enable --now fail2ban

# 2. SSH 登录方式二选一（完整可粘贴流程见 DEPLOYMENT-NON-DOCKER.md §1.2）
#    方案 A（推荐）SSH 密钥：本地 ssh-keygen + ssh-copy-id，验证可免密登录后
#      sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
#
#    方案 B 密码登录 —— 本次事件极可能就是密码爆破导致，务必做完这三步：
#      passwd root                                                        # 1. 强密码
#      sed -i 's/^#\?Port .*/Port 2222/' /etc/ssh/sshd_config            # 2. 改端口
#      cat > /etc/fail2ban/jail.local <<'EOF'                            # 3. 收紧 fail2ban
#      [DEFAULT]
#      bantime   = 24h
#      findtime  = 10m
#      maxretry  = 3
#      backend   = systemd
#      banaction = ufw      ← 关键：缺了它 fail2ban 直接改 iptables，与 ufw 打架，
#                               且 ufw reload 会把封禁记录清空
#      [sshd]
#      enabled   = true
#      EOF
#      systemctl restart fail2ban
#      fail2ban-client get sshd banaction     # 期望：ufw
#      ufw allow 2222/tcp        # 防火墙同步放行新端口（在下面 ufw enable 之前执行）
#      # 然后另开 PuTTY，端口填 2222，确认能登录再关掉当前会话
#
#    复核：sshd -T | grep -E 'passwordauthentication|port'
ls -l /root/.ssh/authorized_keys 2>/dev/null

# 3. 防火墙：入站只开 SSH/80/443；出站默认拒绝后逐条放行必需外连。
#    ICMP 不要用 ufw 命令添加（ufw CLI 不支持，会报
#    ERROR: Need 'to' or 'from' clause）；before.rules 默认已放行
#    echo-request / destination-unreachable(PMTU) 等关键类型，无需额外处理。
#    详见 DEPLOYMENT-NON-DOCKER.md §1.2.1。
ufw --force reset
ufw default deny incoming
ufw default deny outgoing
ufw allow in on lo && ufw allow out on lo
ufw allow in 22/tcp && ufw allow out 22/tcp      # 方案 B 若改端口，这里换成 2222
ufw allow in 80/tcp && ufw allow out 80/tcp
ufw allow in 443/tcp && ufw allow out 443/tcp
ufw allow out 53/udp && ufw allow out 53/tcp
ufw allow out 123/udp          # NTP，证书/时间相关
ufw allow out 587/tcp && ufw allow out 465/tcp && ufw allow out 25/tcp   # SMTP
ufw --force enable && ufw status verbose

# 4. 复核
sshd -T | grep -E 'passwordauthentication|port'
fail2ban-client status sshd
ufw status verbose | head -8
```

> **不要安装 Docker**。PM2 方案不需要它；本次事件中攻击者正是借助 dockerd + 容器名
> 反复拉起矿工容器。少一个攻击面。

---

## 5. 阶段五：恢复站点

> 完整步骤见 [DEPLOYMENT-NON-DOCKER.md](./DEPLOYMENT-NON-DOCKER.md)，
> 下面只是带顺序的恢复视图，**变量值用阶段三轮换后的新值**。

| 步骤 | 参考章节 | 动作 | 备注 |
|------|---------|------|------|
| 1 | §1.1 | 加 2G swap | 2G 内存机器 `next build` 易 OOM |
| 2 | §2 | 装 Node 20 / PostgreSQL 16 / nginx / PM2 / Redis | **不装 Docker** |
| 3 | §3 | 建库建角色，密码用**新密码** | `listen_addresses` 保持 `localhost` |
| 4 | §4 | `git clone` + 新建 `.env` | 用轮换后的全部新凭据 |
| 5 | §5 | `npm ci --legacy-peer-deps` → `db:generate` → `build:server` | 缺 flag 会 `ERESOLVE` 失败 |
| 6 | §6 | 恢复数据库：`pg_restore`（见下） | 顺序在 migrate 之前 |
| 7 | §6 | `npm run db:migrate` | 幂等，已应用的自动跳过 |
| 8 | §5 | 解压上传图片到项目根 `uploads/` | 必须在 `build:server` 前后均可，但要在 `pm2 start` 之前 |
| 9 | §7 | `pm2 start ecosystem.config.js` → `pm2 save` → `pm2 startup` | `UPLOAD_DIR` 已指向项目根 |
| 10 | §8 | 复制 nginx 模板 + 替换域名 + **mkdir 缓存父目录** + `nginx -t && reload` | 漏 `mkdir -p` 会报 `mkdir() "/var/cache/nginx/b2b" failed` |
| 11 | §9 | certbot 申请证书 → **重跑第 10 步**恢复自定义 location | `certbot --nginx` 会改写配置 |
| 12 | §10 | 验证 | 见阶段七 |

**第 6 步：恢复已备份的数据库**

```bash
cd /var/www/b2b-independent-site

# 确认当前连接的是新空库
grep DATABASE_URL .env

# 恢复单库备份
sudo -u postgres dropdb --if-exists <DB_NAME>
sudo -u postgres createdb -O <DB_USER> <DB_NAME>
sudo -u postgres pg_restore -U postgres -d <DB_NAME> --no-owner --role=<DB_USER> /root/incident/db.dump

# 若角色不存在，先按 pg_globals.sql 建，或手工建：
#   sudo -u postgres psql -f /root/incident/pg_globals.sql
#   sudo -u postgres psql -c "ALTER ROLE <DB_USER> WITH PASSWORD '<新密码>';"
```

**第 8 步：恢复上传图片**

```bash
cd /var/www/b2b-independent-site
tar xzf /root/incident/uploads.tar.gz
ls -la uploads/ public/images/ public/uploads/ 2>/dev/null
```

> 恢复后到 `/admin/images` 抽查几张图能否正常显示（走 `/api/uploads/<file>`）。
> 之前修过的「上传后自动保存」逻辑（commit `02253fb`）保证新上传的图不会再丢。

---

## 6. 阶段六：查清并封堵入侵入口

> 不查清入口，重装后仍会再次被入侵。从**旧机器的 `auth.log`**（阶段一已拷出）入手：

```bash
# 6.1 成功的 SSH 登录（对照你本人的 IP 与时间）
grep -E 'Accepted (publickey|password)' /root/incident/auth.log \
  | awk '{print $1, $2, $3, $9, $11}' | sort -u

# 6.2 暴力破解统计（大量 Failed password = 弱密码/22 端口暴露）
grep -c 'Failed password' /root/incident/auth.log
grep 'Failed password' /root/incident/auth.log | awk '{print $9}' | sort | uniq -c | sort -rn | head

# 6.3 有没有 root 之外的可疑登录
grep 'Accepted' /root/incident/auth.log | grep -v 'for root' || echo "无 root 以外的登录"
```

**按结果对症下药：**

| 结论 | 处置 |
|------|------|
| 大量 `Failed password` + 一次陌生 `Accepted password` | 入口是 **SSH 弱密码爆破**。已通过阶段四禁用密码登录 + fail2ban 封堵；再考虑把 22 端口改到非默认端口 |
| 陌生 `Accepted publickey` | 私钥泄露。已在阶段三作废全部密钥；检查本地私钥存放目录是否被同步到过公共仓库 |
| 无任何陌生 SSH 登录 | 入口可能是 **Web 应用漏洞**或 **Docker API 暴露**。检查 `ss -tlnp` 是否有 0.0.0.0 监听的 3000/5432/2375；本项目务必保持 `HOST=127.0.0.1`、PostgreSQL 不开放远程 |

```bash
# 新机器上确认监听面（期望只有 22/80/443 对外）
ss -tlnp | grep -E ':(22|80|443|3000|5432|2375|6379)\b'
```

---

## 7. 阶段七：验收清单

全部通过才算恢复完成：

```bash
# 进程与端口
pm2 status                                   # online，重启次数 ↺ = 0
curl -s http://localhost:3000/api/health     # {"status":"ok",...}
ss -tlnp | grep -E ':(3000|5432)\b'          # 应只 listen 127.0.0.1

# 站点
curl -sI https://commoditychina.com | head -1        # HTTP/2 200
curl -sI https://commoditychina.com/api/health       # 200

# 缓存生效（CPU 优化的关键，MISS 说明没生效）
curl -sI "https://commoditychina.com/_next/image?url=%2Fapi%2Fuploads%2Fxxx.jpg&w=640&q=75" \
  | grep -i x-cache-status
# 第二次请求应为 HIT

# 系统干净
crontab -l                                   # 仅 nginx @reboot，无 amco_/pakchoi
ls -la /tmp                                  # 无 dashboard / 陌生 ELF
id pakchoi 2>&1 | head -1                    # no such user
top -bn1 | head -5                            # %Cpu(s) 个位数
```

- [ ] 后台 `/admin/monitoring` 全绿，且 **Top Processes** 里只有正常进程（本次新增的
      进程归因功能就是为此准备的——见 `src/lib/system/metrics.ts`）
- [ ] 首页、分类页、产品详情页、商品图片正常显示
- [ ] 后台登录正常，图片上传后前台立即可见
- [ ] 下单/支付流程走通（用测试金额验证 PayPal/Stripe）
- [ ] 所有第三方凭据均已轮换，旧凭据确认失效
- [ ] 证书 `certbot renew --dry-run` 通过

---

## 8. 日常安全基线

```bash
# 1. 计划任务与账号每月审计一次
crontab -l; for u in $(cut -d: -f1 /etc/passwd); do crontab -l -u "$u" 2>/dev/null | sed "s/^/[$u] /"; done
cat /etc/passwd | awk -F: '$3 == 0 || $3 >= 1000'

# 2. 自动安全更新（阶段四已装）
systemctl status unattended-upgrades

# 3. 证书自动续期
certbot renew --dry-run

# 4. PM2 开机自启
pm2 save; systemctl list-unit-files | grep pm2

# 5. 磁盘与内存（本站历史上出现过 504 与内存泄漏）
df -h /; free -h; pm2 monit

# 6. 日志轮转
ls -lh /var/log/*.log
```

**监控要点**：`/admin/monitoring` 的 **Top Processes** 是发现异常进程最快的地方——
本次事件若当时就有该功能，第一眼就能看到 `dashboard` 吃满双核，而不必上服务器 `top` 排查。
建议每次部署后顺手扫一眼。

---

## 相关文档

- [DEPLOYMENT-NON-DOCKER.md](./DEPLOYMENT-NON-DOCKER.md) —— PM2 部署完整流程
- [DEPLOYMENT-DOCKER.md](./DEPLOYMENT-DOCKER.md) —— Docker 部署（本项目生产环境未采用）
- [DEPLOYMENT.md](./DEPLOYMENT.md) —— 环境变量与第三方服务配置
