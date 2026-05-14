# Oriental Beauty 生产部署指南

> 部署环境: Linux VPS (Ubuntu 22.04 LTS)  
> 技术栈: Next.js 15 + PostgreSQL 16 + Nginx + PM2 + Docker  
> 最后更新: 2026-05-14

---

## 目录

1. [服务器准备](#1-服务器准备)
2. [环境配置](#2-环境配置)
3. [部署方式一：手动部署 (推荐)](#3-部署方式一手动部署-推荐)
4. [部署方式二：Docker 部署](#4-部署方式二docker-部署)
5. [Nginx 配置](#5-nginx-配置)
6. [SSL 证书](#6-ssl-证书)
7. [环境变量说明](#7-环境变量说明)
8. [数据库迁移](#8-数据库迁移)
9. [Stripe Webhook 配置](#9-stripe-webhook-配置)
10. [PayPal 配置](#10-paypal-配置)
11. [OpenAI 配置](#11-openai-配置)
12. [邮件服务配置](#12-邮件服务配置)
13. [CI/CD 自动部署](#13-cicd-自动部署)
14. [运维命令](#14-运维命令)
15. [监控与日志](#15-监控与日志)
16. [故障排查](#16-故障排查)
17. [安全 checklist](#17-安全-checklist)

---

## 1. 服务器准备

### 1.1 最低配置

| 配置项 | 最低要求 | 推荐 |
|--------|---------|------|
| CPU | 2 核 | 4 核 |
| 内存 | 4 GB | 8 GB |
| 硬盘 | 40 GB SSD | 80 GB SSD |
| 带宽 | 100 Mbps | 1 Gbps |
| 系统 | Ubuntu 22.04 | Ubuntu 22.04 LTS |

### 1.2 初始设置

```bash
# 连接服务器
ssh root@your-server-ip

# 更新系统
apt update && apt upgrade -y

# 创建部署用户
adduser deploy
usermod -aG sudo deploy
su - deploy

# 安装基础工具
sudo apt install -y curl wget git vim ufw fail2ban

# 配置防火墙
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 1.3 安装依赖

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # 应显示 v20.x
npm -v   # 应显示 10.x

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

# Docker (可选，用于容器化部署)
sudo apt install -y docker.io docker-compose-v2
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker deploy
```

### 1.4 配置 PostgreSQL

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE USER orient_user WITH PASSWORD 'your-strong-password';
CREATE DATABASE orient_beauty OWNER orient_user;
GRANT ALL PRIVILEGES ON DATABASE orient_beauty TO orient_user;
\c orient_beauty
GRANT ALL ON SCHEMA public TO orient_user;
\q

# 允许远程连接 (如果需要)
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf
echo "host all all 0.0.0.0/0 md5" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf
sudo systemctl restart postgresql
```

---

## 2. 环境配置

### 2.1 获取项目代码

```bash
# 方式一：从 Git 仓库克隆
cd /var/www
sudo mkdir -p orient-beauty
sudo chown deploy:deploy orient-beauty
git clone https://github.com/your-org/orient-beauty.git .
# 或使用 rsync 从本地推送
# rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.env' ./ orient-beauty/

# 方式二：从本地构建后上传
# 在本地构建后，将整个项目（不含 node_modules）上传到服务器
```

### 2.2 创建环境变量

```bash
cd /var/www/orient-beauty
cp .env .env.production
nano .env.production
```

完整的 `.env.production` 配置参考第 7 节。

---

## 3. 部署方式一：手动部署 (推荐)

### 3.1 安装依赖并构建

```bash
cd /var/www/orient-beauty

# 安装依赖
npm ci --legacy-peer-deps --production

# 生成 Prisma Client
npx prisma generate

# 构建 Next.js
npm run build
```

### 3.2 数据库迁移

```bash
# 推送 schema 到数据库
npx prisma db push

# 或使用迁移 (推荐生产环境)
npx prisma migrate deploy

# 导入种子数据
npx prisma db seed
```

### 3.3 启动应用

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js --env production

# 保存 PM2 进程列表 (服务器重启后自动恢复)
pm2 save
pm2 startup
```

### 3.4 验证部署

```bash
# 查看进程状态
pm2 status
pm2 logs orient-beauty

# 测试 HTTP 响应
curl -I http://localhost:3000
# 应返回 HTTP/1.1 200 OK
```

---

## 4. 部署方式二：Docker 部署

### 4.1 构建镜像

```bash
cd /var/www/orient-beauty

# 创建 .dockerignore
cat > .dockerignore << EOF
node_modules
.next
.git
*.md
.env
.env.*
!.env.production
EOF

# 构建并启动
docker compose -f docker-compose.yml up -d --build
```

### 4.2 Docker Compose 说明

`docker-compose.yml` 包含三个服务：

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| `db` | postgres:16-alpine | 5432 | PostgreSQL 数据库 |
| `app` | 自定义 | 3000 | Next.js 应用 |
| `nginx` | nginx:alpine | 80, 443 | 反向代理 + SSL |

### 4.3 Docker 管理命令

```bash
# 查看日志
docker compose logs -f app

# 重启服务
docker compose restart app

# 重新构建并启动
docker compose up -d --build

# 停止所有
docker compose down

# 进入容器
docker compose exec app sh
```

---

## 5. Nginx 配置

### 5.1 主配置

```bash
sudo nano /etc/nginx/sites-available/orient-beauty
```

```nginx
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name orientalbeauty.com www.orientalbeauty.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name orientalbeauty.com www.orientalbeauty.com;

    # SSL 配置 (见第6节)
    ssl_certificate /etc/letsencrypt/live/orientalbeauty.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/orientalbeauty.com/privkey.pem;

    # 安全头
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 日志
    access_log /var/log/nginx/orient-beauty-access.log;
    error_log /var/log/nginx/orient-beauty-error.log;

    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://nextjs;
        expires 365d;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    location /static/ {
        alias /var/www/orient-beauty/public/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # API 请求
    location /api/ {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # 主要代理
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

### 5.2 启用站点

```bash
sudo ln -s /etc/nginx/sites-available/orient-beauty /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 Nginx 优化

```bash
sudo nano /etc/nginx/nginx.conf
```

```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    multi_accept on;
    worker_connections 65535;
    use epoll;
}

http {
    # 基本设置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/json
        application/javascript
        application/x-javascript
        image/svg+xml;

    # 其他配置...
}
```

---

## 6. SSL 证书

### 6.1 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d orientalbeauty.com -d www.orientalbeauty.com

# 证书自动续期 (certbot 会自动创建定时任务)
sudo certbot renew --dry-run

# 查看证书状态
sudo certbot certificates
```

### 6.2 SSL 配置优化

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
```

---

## 7. 环境变量说明

完整的 `.env.production` 配置：

```bash
# ========== 数据库 ==========
DATABASE_URL="postgresql://orient_user:your-strong-password@localhost:5432/orient_beauty?schema=public"

# ========== NextAuth 认证 ==========
NEXTAUTH_SECRET="$(openssl rand -base64 32)"  # 生成随机密钥
NEXTAUTH_URL="https://orientalbeauty.com"

# Google OAuth (可选)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Apple OAuth (可选)
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""

# ========== Stripe 支付 ==========
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# ========== PayPal 支付 ==========
NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-secret"
PAYPAL_API_URL="https://api-m.paypal.com"

# ========== OpenAI ==========
OPENAI_API_KEY="sk-..."

# ========== 邮件服务 (Resend) ==========
RESEND_API_KEY="re_..."

# ========== 站点配置 ==========
NEXT_PUBLIC_SITE_URL="https://orientalbeauty.com"
NEXT_PUBLIC_SITE_NAME="Oriental Beauty"

# ========== 物流追踪 17Track ==========
NEXT_PUBLIC_17TRACK_API_KEY=""

# ========== 文件上传 ==========
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""
```

### 密钥生成

```bash
# 生成 NEXTAUTH_SECRET
openssl rand -base64 32

# 生成用于密码哈希的盐 (框架会自动处理)
```

---

## 8. 数据库迁移

### 8.1 初始化迁移

```bash
# 首次部署：创建迁移文件
npx prisma migrate dev --name init

# 生产环境：应用迁移
npx prisma migrate deploy
```

### 8.2 数据库管理

```bash
# 推送 schema 变更 (开发/测试用，会清数据)
npx prisma db push

# 创建新的迁移 (生产环境用)
npx prisma migrate dev --name add-product-weight

# 查看迁移状态
npx prisma migrate status

# 打开 Prisma Studio (数据库 GUI)
npx prisma studio
```

### 8.3 数据库备份

```bash
# 手动备份
pg_dump -U orient_user orient_beauty > /backup/orient-beauty-$(date +%Y%m%d).sql

# 自动备份脚本
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup"
DB_NAME="orient_beauty"
DB_USER="orient_user"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/$DB_NAME-$(date +%Y%m%d-%H%M%S).sql.gz"
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# 添加到 crontab (每天凌晨3点执行)
crontab -e
0 3 * * * /usr/local/bin/backup-db.sh
```

---

## 9. Stripe Webhook 配置

### 9.1 创建 Webhook Endpoint

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. 点击 **Add endpoint**
3. Endpoint URL: `https://orientalbeauty.com/api/checkout/webhook`
4. 监听事件:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. 获取 Signing secret (`whsec_...`) 填入 `.env`

### 9.2 本地测试

```bash
# 使用 Stripe CLI 转发 webhook
stripe listen --forward-to localhost:3000/api/checkout/webhook

# 触发测试事件
stripe trigger payment_intent.succeeded
```

---

## 10. PayPal 配置

### 10.1 获取 API 凭据

1. 登录 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 创建或选择你的 App
3. 获取 **Client ID** 和 **Secret**
4. 将 Client ID 填入 `NEXT_PUBLIC_PAYPAL_CLIENT_ID`

### 10.2 沙箱测试

```bash
# .env 中使用沙箱环境
PAYPAL_API_URL="https://api-m.sandbox.paypal.com"
# 使用沙箱的 Client ID 和 Secret
```

### 10.3 生产切换

```bash
# .env 中使用生产环境
PAYPAL_API_URL="https://api-m.paypal.com"
# 使用生产环境的 Client ID 和 Secret
```

### 10.4 中国商业 PayPal 注意事项

- 使用标准的 PayPal Commerce Platform
- 支持美元 (USD) 结算
- 收款直接进入你的 PayPal 账户
- **不需要**香港公司或海外实体
- 仅需中国营业执照即可申请商业 PayPal

---

## 11. OpenAI 配置

### 11.1 获取 API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 创建新 API Key
3. 设置使用限制 (防止意外超额)

### 11.2 配置

```bash
# .env
OPENAI_API_KEY="sk-..."
```

> **注意**: AI 聊天功能使用 `gpt-4o-mini`，成本较低。建议在 OpenAI Dashboard 设置每月消费上限。

---

## 12. 邮件服务配置

### 12.1 Resend 设置

1. 注册 [Resend](https://resend.com)
2. 验证域名
3. 创建 API Key
4. 配置 `.env`:

```bash
RESEND_API_KEY="re_..."
```

### 12.2 邮件模板

系统会自动发送以下邮件：

| 邮件类型 | 触发条件 | 说明 |
|---------|---------|------|
| 订单确认 | 下单成功 | 订单详情和预计送达时间 |
| 发货通知 | 订单发货 | Tracking Number 和物流链接 |
| 购物车放弃提醒 | 用户加购但未结算 | 24小时后发送提醒 |
| Newsletter | 用户订阅 | 推广邮件 (需用户授权) |

---

## 13. CI/CD 自动部署

### 13.1 GitHub Actions 配置

在项目根目录创建 `.github/workflows/deploy.yml`：

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

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci --legacy-peer-deps

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Deploy to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          source: ".,!node_modules"
          target: "/var/www/orient-beauty"

      - name: Restart PM2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/orient-beauty
            npm ci --legacy-peer-deps --production
            npx prisma generate
            npx prisma migrate deploy
            pm2 restart orient-beauty
```

### 13.2 需要配置的 GitHub Secrets

| Secret | 说明 |
|--------|------|
| `HOST` | 服务器 IP |
| `USERNAME` | SSH 用户名 (如 deploy) |
| `SSH_KEY` | SSH 私钥 |
| `DATABASE_URL` | 数据库连接字符串 |

---

## 14. 运维命令

### 14.1 PM2 管理

```bash
# 应用管理
pm2 status                    # 查看所有进程
pm2 logs orient-beauty        # 查看日志
pm2 logs orient-beauty --lines 100  # 查看最近100行
pm2 restart orient-beauty     # 重启
pm2 stop orient-beauty        # 停止
pm2 delete orient-beauty      # 删除进程

# 负载监控
pm2 monit                     # 实时监控
pm2 info orient-beauty        # 进程详情

# 保存和开机自启
pm2 save
pm2 startup
```

### 14.2 日志管理

```bash
# 应用日志
pm2 logs orient-beauty
tail -f /var/www/orient-beauty/logs/out.log
tail -f /var/www/orient-beauty/logs/err.log

# Nginx 日志
tail -f /var/log/nginx/orient-beauty-access.log
tail -f /var/log/nginx/orient-beauty-error.log

# 系统日志
journalctl -u nginx -f
journalctl -u postgresql -f
```

### 14.3 更新部署

```bash
cd /var/www/orient-beauty

# 拉取最新代码
git pull origin main

# 安装依赖
npm ci --legacy-peer-deps --production

# 数据库迁移
npx prisma generate
npx prisma migrate deploy

# 构建
npm run build

# 重启
pm2 restart orient-beauty
```

### 14.4 一键更新脚本

```bash
cat > /usr/local/bin/deploy.sh << 'EOF'
#!/bin/bash
set -e

cd /var/www/orient-beauty

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm ci --legacy-peer-deps --production

echo "Generating Prisma Client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Building application..."
npm run build

echo "Restarting application..."
pm2 restart orient-beauty

echo "Deployment complete!"
EOF

chmod +x /usr/local/bin/deploy.sh
```

---

## 15. 监控与日志

### 15.1 系统监控

```bash
# 安装 Netdata (实时监控面板)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# 或使用 htop 查看进程
htop

# 磁盘使用
df -h

# 内存使用
free -h
```

### 15.2 应用监控

```bash
# PM2 监控
pm2 monit

# 查看 API 响应时间
curl -w "Total: %{time_total}s\n" -o /dev/null -s https://orientalbeauty.com
```

### 15.3 数据库监控

```bash
# 查看数据库连接
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# 查看慢查询
sudo -u postgres psql -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

---

## 16. 故障排查

### 16.1 应用无法启动

```bash
# 检查 PM2 日志
pm2 logs orient-beauty --lines 50

# 检查 Node.js 版本
node -v

# 检查端口占用
lsof -i :3000

# 检查环境变量
cd /var/www/orient-beauty && node -e "console.log(process.env.DATABASE_URL)"
```

### 16.2 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 测试连接
psql -U orient_user -d orient_beauty -h localhost

# 检查 max_connections
sudo -u postgres psql -c "SHOW max_connections;"
```

### 16.3 502 Bad Gateway

```bash
# 检查应用是否运行
pm2 status

# 检查 Nginx
sudo nginx -t
sudo systemctl status nginx

# 检查端口
curl -I http://localhost:3000
```

### 16.4 SSL 证书问题

```bash
# 检查证书
sudo certbot certificates

# 强制续期
sudo certbot renew --force-renewal

# 查看 Nginx SSL 错误
tail -f /var/log/nginx/error.log
```

### 16.5 内存不足

```bash
# 查看内存使用
free -h

# 调整 PM2 内存限制
pm2 restart orient-beauty --max-memory-restart 500M

# 创建 swap (如果系统没有)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 17. 安全 Checklist

### 17.1 服务器安全

- [ ] SSH 使用密钥登录，禁用密码登录
- [ ] 修改默认 SSH 端口 (22 → 自定义端口)
- [ ] 开启 UFW 防火墙 (仅开放 22, 80, 443)
- [ ] 安装并配置 fail2ban
- [ ] 自动安全更新: `sudo apt install unattended-upgrades`
- [ ] 禁用 root 直接 SSH 登录

### 17.2 数据库安全

- [ ] 使用强密码 (32位以上随机字符)
- [ ] 限制数据库访问 IP
- [ ] 定期自动备份
- [ ] 备份文件加密存储

### 17.3 应用安全

- [ ] NEXTAUTH_SECRET 使用强随机字符串
- [ ] 所有 API Key 通过环境变量注入
- [ ] Stripe Webhook 签名验证已启用
- [ ] HTTPS 强制跳转
- [ ] 安全头已配置 (HSTS, X-Frame-Options 等)
- [ ] 文件上传大小限制 (client_max_body_size)

### 17.4 监控告警

- [ ] 配置 PM2 内存重启阈值
- [ ] 设置磁盘使用率告警 (>80%)
- [ ] 监控 SSL 证书到期时间
- [ ] 配置 500 错误告警

---

## 附录

### A. 文件上传存储方案

当前使用 **UploadThing** 作为文件存储。生产环境建议切换到 S3 兼容存储：

```bash
# MinIO (自托管 S3)
docker run -d --name minio \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=your-password \
  -v /data/minio:/data \
  minio/minio server /data --console-address ":9001"

# AWS S3 (托管)
# 在 .env 中配置 AWS 凭据
```

### B. CDN 加速

推荐使用 Cloudflare 作为 CDN 和 DNS:

1. 在 Cloudflare 添加域名
2. 配置 DNS 记录指向服务器 IP
3. 开启 Proxy (橙色云朵) 启用 CDN
4. 配置 Page Rules 缓存静态资源

### C. 性能优化

```bash
# 启用 Next.js 输出文件追踪 (减小部署体积)
# next.config.ts 已配置 output: "standalone"

# 启用图片优化 (sharp)
# 已安装 sharp 包

# 数据库查询优化
# 已创建 Prisma 索引 (@@index)
```

### D. 支付系统双重保障

系统同时支持 **Stripe** 和 **PayPal** 两种支付方式：

- **Stripe**: 信用卡支付 (Visa, Mastercard, Amex, 银联)
- **PayPal**: PayPal 账户支付 (支持中国商业 PayPal)

用户可以在结账页面自由选择支付方式，两种方式都经过完整测试。
