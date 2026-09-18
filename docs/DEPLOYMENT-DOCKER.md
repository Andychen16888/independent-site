# 部署指南 ①：Docker 部署（docker compose）

> 适用：已安装 Docker 的服务器（建议 2 核 4GB 以上，镜像构建需要内存）。
> 技术栈：Docker + PostgreSQL 16 + 多阶段构建的 Next.js standalone 镜像 + Nginx 容器
> 配套文档：[非 Docker 部署教程](./DEPLOYMENT-NON-DOCKER.md)　|　[部署总览与通用参考](./DEPLOYMENT.md)
>
> ⚠️ 本教程与"非 Docker 教程"**互相独立**，二选一即可。全程只按本教程执行，不要混用命令。

---

## 目录

1. [服务器准备](#1-服务器准备)
2. [安装 Docker](#2-安装-docker)
3. [获取代码与环境变量](#3-获取代码与环境变量)
4. [首次启动（构建镜像 + 迁移 + 运行）](#4-首次启动构建镜像--迁移--运行)
5. [SSL 证书](#5-ssl-证书)
6. [验证部署](#6-验证部署)
7. [更新部署](#7-更新部署)
8. [运维命令](#8-运维命令)
9. [故障排查](#9-故障排查)
10. [通用参考（支付/邮件/SEO/管理后台）](#10-通用参考支付邮件seo管理后台)

---

## 1. 服务器准备

### 1.1 最低配置

| 配置项 | 最低 | 推荐 |
|--------|------|------|
| CPU | 2 核 | 4 核 |
| 内存 | 4 GB | 8 GB |
| 硬盘 | 40 GB SSD | 80 GB SSD |
| 系统 | Ubuntu 22.04 | Ubuntu 22.04 LTS |

> Docker 镜像构建（`npm ci` + `next build`）需要 2GB+ 内存，4GB 以下先加 swap：
>
> ```bash
> sudo fallocate -l 4G /swapfile
> sudo chmod 600 /swapfile
> sudo mkswap /swapfile
> sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

### 1.2 安全加固

```bash
ssh root@your-server-ip
apt update && apt upgrade -y

# 禁止密码登录（先 ssh-copy-id 传好公钥）
sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd

# 防火墙
ufw --force reset
ufw default deny incoming
ufw default deny outgoing
ufw allow in on lo
ufw allow out on lo
ufw allow in 22/tcp
ufw allow in 80/tcp
ufw allow in 443/tcp
ufw allow out 22,80,443,587,465,25/tcp
ufw allow out 53,123/udp
ufw allow in proto icmp
ufw allow out proto icmp
ufw --force enable
ufw status verbose

apt install -y fail2ban unattended-upgrades
systemctl enable --now fail2ban
apt install -y curl wget git vim
```

---

## 2. 安装 Docker

```bash
# 官方一键安装（含 docker compose 插件）
curl -fsSL https://get.docker.com | sh

# 验证
docker --version
docker compose version
```

把 root 用户加入 docker 组（可选，root 无需）：

```bash
# 如果使用非 root 部署账号
usermod -aG docker $USER
```

---

## 3. 获取代码与环境变量

```bash
cd /var/www
git clone https://github.com/Andychen16888/B2B-Independent-Site.git
chown -R root:root b2b-independent-site
cd b2b-independent-site
```

**创建 `.env`（用于 compose 变量替换）：**

```bash
cp .env.example .env
nano .env
```

**必填项**（compose 会读取 `.env` 替换 `${VAR}`）：

| 变量 | 说明 | 示例 |
|------|------|------|
| `POSTGRES_USER` | 数据库用户（默认 b2b_user） | `b2b_user` |
| `POSTGRES_PASSWORD` | 数据库密码 | 强密码 |
| `POSTGRES_DB` | 数据库名（默认 b2b_independent_site） | `b2b_independent_site` |
| `NEXTAUTH_SECRET` | 随机密钥 | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | 站点 https 地址 | `https://commoditychina.com` |
| `NEXT_PUBLIC_SITE_URL` | 同站点地址 | `https://commoditychina.com` |
| `NEXT_PUBLIC_SITE_NAME` | 站点名 | `Commodities From China` |

> ⚠️ 重要：`NEXT_PUBLIC_*` 是**构建期变量**，必须在 `build.args` 传入（compose 已配置好，从 `.env` 自动读取）。改这几个值后必须**重新构建镜像**才生效，而不是 `restart`。

> compose 文件中 `DATABASE_URL` 默认值为 `postgresql://b2b_user:b2b_password@db:5432/b2b_independent_site?schema=public`。如果你改动了 `POSTGRES_USER/PASSWORD/DB`，请同时把 `DATABASE_URL` 写到 `.env` 覆盖默认值（改成对应的用户名/密码/库名）。

---

## 4. 首次启动（构建镜像 + 迁移 + 运行）

```bash
cd /var/www/b2b-independent-site

# 构建并一次性完成：db 健康检查 → migrate（迁移+种子）→ app → nginx
docker compose up -d --build
```

compose 里包含 4 个服务：

| 服务 | 作用 | 说明 |
|------|------|------|
| `db` | PostgreSQL 16 | 数据存 `postgres_data` volume，仅本机 5432 监听 |
| `migrate` | 一次性迁移 | `prisma migrate deploy` + `db:seed`，跑完即退出 |
| `app` | Next.js standalone | 监听 `127.0.0.1:3000`，上传存 `uploads` volume |
| `nginx` | 反向代理 + SSL | 80/443，配置在 `deploy/nginx.conf`，证书挂 `./ssl` |

> `migrate` 服务由 `depends_on: condition: service_completed_successfully` 保证：数据库健康后才执行迁移，迁移成功后才启动 app。

**查看状态：**

```bash
docker compose ps
docker compose logs -f migrate    # 迁移日志，确认无报错
```

此时 Nginx 容器可能因缺少 `./ssl/fullchain.pem` 而反复重启——这是预期的，先完成第 5 节申请证书。

---

## 5. SSL 证书

> **前置**：域名 A/AAAA 记录已解析到本服务器 IP。证书文件放在宿主机 `./ssl/` 目录，由 Nginx 容器只读挂载到 `/etc/nginx/ssl/`。

```bash
# 停止 nginx 容器，释放 80 端口给 certbot 临时使用
docker compose stop nginx

# 安装 certbot（宿主机）
sudo apt update && sudo apt install -y certbot

# 申请证书（standalone 模式，需临时占用 80）
sudo certbot certonly --standalone -d commoditychina.com -d www.commoditychina.com \
  --email you@example.com --agree-tos --no-eff-email

# 复制证书到项目 ./ssl/ 目录（compose 挂载路径）
mkdir -p /var/www/b2b-independent-site/ssl
sudo cp /etc/letsencrypt/live/commoditychina.com/fullchain.pem /var/www/b2b-independent-site/ssl/
sudo cp /etc/letsencrypt/live/commoditychina.com/privkey.pem /var/www/b2b-independent-site/ssl/
chmod 644 /var/www/b2b-independent-site/ssl/*.pem

# 恢复 nginx 容器
docker compose start nginx
docker compose ps
```

**证书续期**（Let's Encrypt 90 天，需在宿主机上手动或 crontab 自动化）：

```bash
sudo certbot renew --dry-run
```

> 自动化：`crontab -e` 添加 `0 3 * * 1 /usr/bin/certbot renew --quiet --deploy-hook "docker compose -f /var/www/b2b-independent-site/docker-compose.yml restart nginx"`（续期成功后自动重启 nginx 容器加载新证书）。

---

## 6. 验证部署

```bash
# 1. compose 全部运行中
docker compose ps

# 2. app 健康检查（不依赖数据库）
curl http://localhost:3000/api/health

# 3. 从外部
curl -I https://commoditychina.com          # 期望 HTTP/2 200
curl -I http://commoditychina.com           # 期望 301 → https
```

---

## 7. 更新部署

```bash
cd /var/www/b2b-independent-site

# 拉取最新代码
git pull origin main

# 重新构建并启动（会自动重跑迁移服务；NEXT_PUBLIC_* 变更也在此生效）
docker compose up -d --build

# 如需强制重新执行迁移（比如修复了迁移脚本）
docker compose run --rm migrate

# 查看日志确认
docker compose ps
docker compose logs --tail=100 app
```

---

## 8. 运维命令

```bash
docker compose ps                         # 所有容器状态
docker compose logs -f app                # 实时应用日志
docker compose logs --tail=100 nginx      # nginx 日志
docker compose restart app                # 重启 app
docker compose stop nginx                 # 停止 nginx（临时维护）
docker compose start nginx                # 启动 nginx
docker compose down                       # 停止所有（保留 volume 数据）
docker compose down -v                    # ⚠️ 停止并删除数据卷（数据丢失，慎用）
docker compose exec app sh                # 进入 app 容器调试
docker compose run --rm migrate           # 手动重新执行迁移+种子

# 数据卷
docker volume ls                          # postgres_data / uploads
```

**数据库备份**（宿主机执行，用宿主映射的 5432）：

```bash
# 手动备份
pg_dump -U b2b_user -h 127.0.0.1 -p 5432 b2b_independent_site > /backup/b2b-$(date +%Y%m%d).sql
```

> 注意：compose 中 `db` 仅监听 `127.0.0.1`,请在宿主机用 `127.0.0.1:5432` 连接执行 pg_dump。

---

## 9. 故障排查

| 现象 | 排查 |
|------|------|
| `nginx` 一直重启 | 缺少 `./ssl/fullchain.pem`、`privkey.pem`——先完成第 5 节；或 `docker compose logs --tail=50 nginx` |
| `app` 未启动 / `migrate` 失败 | `docker compose logs migrate`，多为 DATABASE_URL 与 POSTGRES_* 不一致 |
| 修改 `NEXT_PUBLIC_*` 后页面没变 | 必须 `docker compose up -d --build` 重新构建，restart 无效 |
| 502 Bad Gateway | `curl http://localhost:3000/api/health`；app 是否在跑 |
| 端口 80 被占用 | certbot standalone 前 `docker compose stop nginx` |
| 构建 OOM | 加 swap（第 1.1 节） |

---

## 10. 通用参考（支付/邮件/SEO/管理后台）

以下内容与部署方式无关，部署完成后按需配置，请看 [DEPLOYMENT.md](./DEPLOYMENT.md)：

- 环境变量完整说明
- Stripe / PayPal 支付配置
- Gmail SMTP 邮件
- 管理后台初始化与登录
- 数据库备份 / 监控 / 安全 checklist
- SEO / GEO / CDN 优化
- CI/CD 自动部署