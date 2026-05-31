# Oriental Beauty 生产部署指南

> 部署环境: Linux VPS (Ubuntu 22.04 LTS)  
> 技术栈: Next.js 15 + PostgreSQL 16 + Nginx + PM2 + Docker  
> 最后更新: 2026-05-29  
> 
> **SEO / GEO / CDN 章节已同步更新于 2026-05-14**

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
18. [SEO 优化部署指南](#18-seo-优化部署指南)
19. [GEO 优化部署指南](#19-geo-生成式引擎优化-部署指南)
20. [CDN 加速与缓存策略](#20-cdn-加速与缓存策略)
21. [管理后台部署指南](#21-管理后台部署指南)

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

> **安全警告**: 新服务器在配置完成前，对外暴露的时间越短越好。以下步骤必须在第一时间完成，**在安装任何依赖或克隆代码之前**先做安全加固。

```bash
# 连接服务器
ssh root@your-server-ip

# 更新系统
apt update && apt upgrade -y

# ========== 立即安全加固（前置，必须最先执行） ==========

# 1. 创建部署用户并赋予 sudo
adduser deploy
usermod -aG sudo deploy

# 2. 配置 SSH 密钥登录（不要复制密码！在本地执行 ssh-copy-id）
exit  # 退出 root 会话，回到本地
ssh-copy-id deploy@your-server-ip  # 在本地终端执行，上传公钥
ssh deploy@your-server-ip          # 用新用户登录

# 3. 禁止 root 和密码登录
sudo sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 4. 立即启用防火墙（只放行 SSH、HTTP、HTTPS）
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default deny outgoing
sudo ufw allow in on lo
sudo ufw allow out on lo
sudo ufw allow out 53          # DNS 解析
sudo ufw allow in 22/tcp       # SSH
sudo ufw allow out 22/tcp      # SSH 出站
sudo ufw allow in 80/tcp       # HTTP
sudo ufw allow out 80/tcp      # HTTP 出站
sudo ufw allow in 443/tcp      # HTTPS
sudo ufw allow out 443/tcp     # HTTPS 出站
sudo ufw --force enable
sudo ufw status verbose

# 5. 安装 fail2ban（SSH 防爆破）
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban

# 6. 开启自动安全更新
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# 7. 安装基础工具
sudo apt install -y curl wget git vim

echo "✓ 安全加固完成，可以继续部署"
```

### 1.3 安全原则（防止木马和挖矿程序植入）

| 原则 | 说明 |
|------|------|
| **最小权限** | 永远用普通用户（`deploy`）操作，禁止 root 日常使用 |
| **最小暴露** | Node 服务必须绑定 `127.0.0.1`，只通过 Nginx 对外 |
| **最小端口** | 防火墙仅开放 22/80/443，拒绝其他所有端口 |
| **密钥认证** | 禁用密码登录，SSH key + 口令短语 |
| **定期审查** | 每周检查进程列表、网络连接、cron 任务 |

#### 常见木马特征（部署后应定期检查）

```bash
# 检查挖矿进程
ps aux | grep -E "xmrig|minerd|kdevtmpfs|kinsing|xig|sustse|donate"
ss -antp | grep -E "43[0-9]{2}|3333|5555|14444|9999"  # 常见矿池端口

# 检查异常网络外联
ss -antp | grep "ESTAB" | grep -v "127.0.0.1"

# 检查可疑 systemd 服务
systemctl list-units --type=service --state=running | grep -E "xmrig|scanner|update|cloud|sysupdate"

# 检查定时任务
cat /etc/crontab 2>/dev/null
ls -la /etc/cron.d/ 2>/dev/null
crontab -l
for user in $(awk -F: '$3>=1000{print $1}' /etc/passwd); do crontab -u $user -l 2>/dev/null; done

# 检查 SSH authorized_keys 后门
cat ~/.ssh/authorized_keys
for dir in /root /home/*; do [ -f "$dir/.ssh/authorized_keys" ] && echo "=== $dir ===" && cat "$dir/.ssh/authorized_keys"; done

# 检查 LD_PRELOAD 后门
cat /etc/ld.so.preload 2>/dev/null

# 检查 /dev/shm /tmp 可疑文件
ls -la /dev/shm/ /tmp/ /var/tmp/ 2>/dev/null
```

> **如果发现上述任何异常**：立即切断网络连接，备份数据，重装系统。手动清理无法根除 rootkit 级别的木马。

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
git clone https://github.com/Andychen16888/orient-beauty.git
sudo chown -R deploy:deploy orient-beauty
cd orient-beauty
# 或使用 rsync 从本地推送
# rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.env' ./ orient-beauty/

# 方式二：从本地构建后上传
# 在本地构建后，将整个项目（不含 node_modules）上传到服务器
```

### 2.2 创建环境变量

```bash
cd /var/www/orient-beauty
nano .env
```

完整的 `.env` 配置参考第 7 节。

---

## 3. 部署方式一：手动部署 (推荐)

### 3.1 安装依赖并构建

```bash
cd /var/www/orient-beauty

# 拉取最新代码 (如果通过 git 部署)
git pull origin main

# 安装依赖 (包含构建所需的 devDeps)
npm ci --legacy-peer-deps

# 生成 Prisma Client
npm run db:generate

# 构建 Next.js (standalone 模式)
# 如果服务器内存小于 4GB，构建可能因内存不足失败，脚本已自动增加内存限制
# 构建后会自动将静态资源复制到 standalone 输出目录
npm run build
```

> **说明**:  
> - `npm ci` 会安装所有依赖（含 devDependencies），因为 `prisma` CLI 和 TypeScript 在构建阶段是必需的。  
> - Next.js 的 `output: "standalone"` 会在构建后自动提取仅运行所需的文件到 `.next/standalone/`（含 `server.js`）。**运行时必须使用 `node .next/standalone/server.js`，不能用 `next start`**。  
> - PM2 配置 (`ecosystem.config.js`) 已设置为直接运行 `server.js`。  
> - 构建时自动设置 `NODE_OPTIONS="--max-old-space-size=4096"` 以避免小内存服务器（< 4GB）上 OOM 崩溃。如服务器内存 ≥ 4GB，可手动减小此值。  
> - `npm run build` 已包含将 `.next/static` 复制到 `.next/standalone/.next/static/` 的步骤，无需手动执行。

### 3.3 数据库迁移

```bash
# 重要: 首次部署必须使用 db:push (项目无迁移文件)
# db:migrate 仅当 prisma/migrations/ 目录存在迁移文件时才有效
npm run db:push

# 导入种子数据 (创建管理员账号和初始数据)
npm run db:seed
```

> **顺序不能错**: 必须先 `db:push`（创建表）再 `db:seed`（填充数据），否则 seed 会报 `table does not exist`。

### 3.4 启动应用

```bash
cd /var/www/orient-beauty

# 确保拉取最新代码 (否则可能运行旧版 next start 而非 standalone)
git pull origin main

# 启动方式一 (推荐): 使用 ecosystem.config.js (自动读取环境变量配置)
# 注意: ecosystem.config.js 已配置 HOST=127.0.0.1，确保 Node 仅监听本地
pm2 start ecosystem.config.js

# 启动方式二: 直接运行 standalone server.js
# pm2 start .next/standalone/server.js --name orient-beauty -- --hostname 127.0.0.1

# 保存 PM2 进程列表 (服务器重启后自动恢复)
pm2 save
pm2 startup
```

### 3.5 验证部署

```bash
# 1. 检查 PM2 进程是否正常运行
pm2 status
# 应显示 orient-beauty 为 online，状态绿色

# 2. 查看启动日志 (确认无报错)
pm2 logs orient-beauty --lines 20

# 3. 使用健康检查端点 (不依赖数据库)
curl http://localhost:3000/api/health
# 应返回 {"status":"ok","timestamp":"...","uptime":...,"memory":...}

# 4. 测试首页 HTML 响应
curl -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000
# 应返回 HTTP 200
```

> **外部访问验证**: 完成 [Nginx 配置](#5-nginx-配置) 和 [SSL 证书](#6-ssl-证书) 后，在 [§6.3 验证 SSL 与外部访问](#63-验证-ssl-与外部访问) 中通过域名测试。

### 3.6 启动失败排查

如果 PM2 启动后状态为 `errored` 或 `stopped`：

```bash
# 查看详细错误日志
pm2 logs orient-beauty --lines 50

# 尝试前台启动查看错误 (standalone 模式)
NODE_ENV=production node .next/standalone/server.js

# 常见原因：
# - .env 中 DATABASE_URL 配置错误 → 检查数据库连接
# - 端口 3000 被占用 → lsof -i :3000
# - node_modules 不完整 → npm ci --legacy-peer-deps
```

---

## 4. 部署方式二：Docker 部署

### 4.1 获取代码并构建镜像

```bash
# 首次部署先克隆代码
cd /var/www
git clone https://github.com/Andychen16888/orient-beauty.git
sudo chown -R deploy:deploy orient-beauty
cd orient-beauty

# 创建 .dockerignore
cat > .dockerignore << EOF
node_modules
.next
.git
*.md
!.env
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

> **注意**: 将下列所有 `your-domain.com` 替换为你的实际域名（如 `hhbtec.com`）。

#### 首次配置（HTTP 仅用于获取 SSL 证书）

```bash
sudo nano /etc/nginx/sites-available/orient-beauty
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }
}
```

#### 获取 SSL 证书后再添加 HTTPS

```bash
# 更新软件源并安装 Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 获取证书 (certbot 会自动修改 Nginx 配置添加 SSL)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 测试证书自动续期
sudo certbot renew --dry-run

# 查看证书状态
sudo certbot certificates
```

> **注意**: 
> - 运行 `certbot --nginx` 之前，必须先配置好 HTTP 版 Nginx（见上方），并确保域名 DNS 已解析到服务器 IP。Certbot 会自动修改 Nginx 配置添加 HTTPS 和 SSL 证书路径。
> - 如果遇到 `ERR_CERT_AUTHORITY_INVALID`，说明你的 Nginx 配置引用了错误的证书路径。执行 `sudo certbot --nginx -d your-domain.com -d www.your-domain.com` 重新申请或修复。
> - 申请成功后，Nginx 配置中的证书路径会自动更新为 `/etc/letsencrypt/live/your-domain.com/` 下的证书文件。

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # Certbot 自动添加
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

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
        proxy_pass http://127.0.0.1:3000;
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
        proxy_pass http://127.0.0.1:3000;
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
        proxy_pass http://127.0.0.1:3000;
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
# 更新软件源并安装 Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 获取证书 (替换 your-domain.com 为实际域名)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 证书自动续期 (certbot 会自动创建定时任务)
sudo certbot renew --dry-run

# 查看证书状态
sudo certbot certificates
```

> **重要**: 运行 `certbot --nginx` 之前，必须先配置好 HTTP 版 Nginx（见 5.1 节首次配置），并确保域名 DNS 已解析到服务器 IP。Certbot 会自动修改 Nginx 配置添加 SSL。

### 6.2 SSL 配置优化

> **Certbot 已自动应用最佳 SSL 配置，一般情况下无需手动修改。**

#### 检查 Certbot 自带的 SSL 配置

Certbot 会自动生成 `/etc/letsencrypt/options-ssl-nginx.conf`，并通过 `include` 指令加载。此文件已包含所有必要的 SSL 安全配置。查看其实际内容：

```bash
cat /etc/letsencrypt/options-ssl-nginx.conf
```

典型输出如下（Certbot 版本 ≥ 2.0）：

```nginx
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:...;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
```

#### 为什么不需要手动添加？

因为站点配置中已包含 `include /etc/letsencrypt/options-ssl-nginx.conf;`，上述所有 SSL 指令都已被加载。**手动在站点配置中再次添加任何已存在的指令，都会导致 Nginx 报错**：

```
nginx: [emerg] "ssl_session_timeout" directive is duplicate
```

#### 如果需要覆盖某个默认值

不要直接在站点配置中添加同名指令，而是按下述步骤操作：

```bash
# 1. 复制 options-ssl-nginx.conf 并移除需要覆盖的行
sudo cp /etc/letsencrypt/options-ssl-nginx.conf /etc/letsencrypt/options-ssl-nginx.conf.bak

# 2. 编辑 options-ssl-nginx.conf，注释掉需要覆盖的行
sudo nano /etc/letsencrypt/options-ssl-nginx.conf
# 例如将 ssl_session_timeout 1440m; 改为 # ssl_session_timeout 1440m;

# 3. 在站点配置中添加新值
sudo nano /etc/nginx/sites-available/orient-beauty
# 在 include 行之后添加: ssl_session_timeout 1d;

# 4. 测试并重载
sudo nginx -t && sudo systemctl reload nginx
```

> **建议**: 除非你有特定的安全合规要求（如 PCI DSS 需要调整加密套件），否则保持 Certbot 默认配置即可，它已经是行业最佳实践。

#### 验证 SSL 评分

```bash
# 访问以下 URL 测试 SSL 配置 (替换 your-domain.com 为实际域名)
# https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
# 目标: A 或 A+ 评分
```

### 6.3 验证 SSL 与外部访问

> **前置条件**: Nginx 已配置并启用（§5），SSL 证书已申请（§6.1）。如未完成，请先完成上述步骤。

```bash
# 1. 测试 Nginx 配置文件语法
sudo nginx -t
# 应输出: syntax is ok / test is successful

# 2. 重载 Nginx 使配置生效
sudo systemctl reload nginx

# 3. 从外部访问 (替换为你的域名)
curl -I https://hhbtec.com
# 应返回 HTTP/1.1 200 OK

# 4. 验证 HTTP 自动跳转 HTTPS
curl -I http://hhbtec.com
# 应返回 301 Moved Permanently → Location: https://hhbtec.com/

# 5. 测试 API 健康检查 (通过 Nginx)
curl -I https://hhbtec.com/api/health
# 应返回 HTTP/1.1 200 OK

# 6. 检查 SSL 证书信息
echo | openssl s_client -connect hhbtec.com:443 -servername hhbtec.com 2>/dev/null | openssl x509 -noout -dates
```

---

## 7. 环境变量说明

完整的 `.env` 配置：

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
# 推送 schema 直接创建表 (项目无迁移文件时使用)
npm run db:push

# 填充初始数据 (创建管理员、分类等)
npm run db:seed
```

### 8.2 数据库管理

```bash
# 首次部署：推送 schema 创建表 (无迁移文件时)
npm run db:push

# 填充初始数据 (创建管理员、分类等)
npm run db:seed

# 后续 schema 变更：如需创建迁移文件 (生产环境推荐)
# 注意: 此命令需要本地开发环境，不要在服务器上运行
# npx prisma migrate dev --name add-product-weight

# 应用待处理的迁移 (当 prisma/migrations/ 存在迁移文件时)
# npm run db:migrate

# 查看迁移状态
npx prisma migrate status

# 打开 Prisma Studio (数据库 GUI)
npx prisma studio
```

> **注意**: 
> - `prisma.config.ts` 存在时，Prisma 会跳过自动加载 `.env` 的步骤，改为由配置文件手动加载。因此 `.env` 文件必须存在且包含 `DATABASE_URL`。
> - 始终使用 `npm run db:*` 命令代替 `npx prisma *`，确保使用项目本地安装的 Prisma 版本，避免全局 Prisma 版本不兼容。
> - 首次部署必须使用 `db:push`（项目不含迁移文件）。`db:migrate` 仅在 `prisma/migrations/` 目录存在迁移文件时才有效。

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

> **当前状态**: Stripe 支付暂未启用，先保留代码和配置模板，后期启用。部署时 Stripe 相关环境变量可留空。

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
        run: npm run db:generate

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
            cp .env .env
            npm ci --legacy-peer-deps
            npm run db:generate
            npm run db:push
            npm run db:seed
            npm run build
            pm2 restart orient-beauty
```
EOF

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
# 应用管理 (standalone 模式，运行 .next/standalone/server.js)
pm2 status                    # 查看所有进程
pm2 logs orient-beauty        # 查看日志
pm2 logs orient-beauty --lines 100  # 查看最近100行
pm2 restart orient-beauty     # 重启
pm2 stop orient-beauty        # 停止
pm2 delete orient-beauty      # 删除进程
pm2 start ecosystem.config.js --update-env  # 从配置文件启动 (推荐，含 HOST/PORT 环境变量)
pm2 start .next/standalone/server.js --name orient-beauty -- --hostname 127.0.0.1  # 直接启动 standalone

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

# 安装依赖 (含构建所需的 devDeps)
npm ci --legacy-peer-deps

# 生成 Prisma Client
npm run db:generate

# 数据库迁移 (首次部署用 db:push，有迁移文件后用 db:migrate)
npm run db:push

# 填充种子数据 (如无新数据可跳过)
npm run db:seed

# 构建 (生成 standalone 模式的 .next/standalone/server.js，自动复制静态资源)
npm run build

# 重启 PM2 (ecosystem.config.js 启动 standalone server.js)
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
npm ci --legacy-peer-deps

echo "Generating Prisma Client..."
npm run db:generate

echo "Pushing database schema..."
npm run db:push

echo "Seeding database..."
npm run db:seed

echo "Building application (standalone mode)..."
npm run build

echo "Restarting application (via standalone server.js)..."
pm2 restart orient-beauty

echo "Deployment complete!"
EOF

chmod +x /usr/local/bin/deploy.sh
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
# 应用管理 (standalone 模式，运行 .next/standalone/server.js)
pm2 status                    # 查看所有进程
pm2 logs orient-beauty        # 查看日志
pm2 logs orient-beauty --lines 100  # 查看最近100行
pm2 restart orient-beauty     # 重启
pm2 stop orient-beauty        # 停止
pm2 delete orient-beauty      # 删除进程
pm2 start ecosystem.config.js --update-env  # 从配置文件启动 (推荐，含 HOST/PORT 环境变量)
pm2 start .next/standalone/server.js --name orient-beauty -- --hostname 127.0.0.1  # 直接启动 standalone

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

# 确保 Prisma 可读取环境变量 (prisma.config.ts 会加载此文件)
cp .env .env

# 安装依赖 (含构建所需的 devDeps)
npm ci --legacy-peer-deps

# 生成 Prisma Client
npm run db:generate

# 数据库迁移 (首次部署用 db:push，有迁移文件后用 db:migrate)
npm run db:push

# 填充种子数据 (如无新数据可跳过)
npm run db:seed

# 构建 (生成 standalone 模式的 .next/standalone/server.js，自动复制静态资源)
npm run build

# 重启 PM2 (ecosystem.config.js 启动 standalone server.js)
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

echo "Copying environment variables for Prisma (loaded by prisma.config.ts)..."
cp .env .env

echo "Installing dependencies..."
npm ci --legacy-peer-deps

echo "Generating Prisma Client..."
npm run db:generate

echo "Pushing database schema..."
npm run db:push

echo "Seeding database..."
npm run db:seed

echo "Building application (standalone mode)..."
npm run build

echo "Restarting application (via standalone server.js)..."
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

# 检查 standalone server 是否构建成功
ls -la /var/www/orient-beauty/.next/standalone/server.js

# 尝试前台启动 standalone server (查看错误信息)
NODE_ENV=production node /var/www/orient-beauty/.next/standalone/server.js

# 检查 Node.js 版本
node -v

# 检查端口占用
lsof -i :3000

# 检查环境变量 (确保 .env 包含 DATABASE_URL)
cd /var/www/orient-beauty && cat .env | grep DATABASE_URL
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

# 检查健康端点 (不依赖数据库)
curl http://localhost:3000/api/health
# 应返回 {"status":"ok","timestamp":"...","uptime":...}

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

# 调整 PM2 运行时内存限制
pm2 restart orient-beauty --max-memory-restart 1G

# 构建时内存不足 (JavaScript heap out of memory)
# 项目已内置 NODE_OPTIONS="--max-old-space-size=4096"，如果仍然 OOM：
NODE_OPTIONS="--max-old-space-size=6144" npm run build

# 创建 swap (如果系统没有)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 验证 swap
free -h
swapon --show
```

---

## 17. 安全 Checklist

### 17.1 服务器安全（防入侵基础）

- [ ] SSH 使用密钥登录，禁用密码登录（`PasswordAuthentication no`）
- [ ] 禁用 root 直接 SSH 登录（`PermitRootLogin no`）
- [ ] 使用普通用户（`deploy`）进行日常操作
- [ ] 开启 UFW 防火墙，仅允许 22/80/443 端口入站
- [ ] UFW 出站规则限制：仅允许 DNS(53)、HTTP(80)、HTTPS(443) 和 loopback
- [ ] 安装并配置 fail2ban（SSH 防爆破，maxretry=3）
- [ ] 自动安全更新（`unattended-upgrades`）
- [ ] Node 服务绑定 `127.0.0.1`，禁止暴露在公网
- [ ] 修改默认 SSH 端口（可选，22 端口会被大量扫描）

### 17.2 防木马/挖矿程序（基于实际入侵案例）

- [ ] 部署后立即执行：`ps aux | grep -E "xmrig|minerd|kdevtmpfs|kinsing"` 确认无异常进程
- [ ] 检查异常网络连接：`ss -antp | grep ESTAB | grep -v 127.0.0.1`
- [ ] 检查 systemd 中可疑服务：`systemctl list-units --type=service --state=running`
- [ ] 检查 cron 后门：`cat /etc/crontab && ls /etc/cron.d/ && crontab -l`
- [ ] 检查 SSH authorized_keys 后门：`cat ~/.ssh/authorized_keys`
- [ ] 检查 LD_PRELOAD 后门：`cat /etc/ld.so.preload 2>/dev/null`
- [ ] 检查 /tmp、/var/tmp、/dev/shm 中异常可执行文件
- [ ] 每周定时执行以上检查（可写入 crontab 自动化）

### 17.3 数据库安全

- [ ] 使用强密码（32位以上随机字符）
- [ ] 确保 PostgreSQL 只监听 `127.0.0.1`（`listen_addresses = 'localhost'`）
- [ ] 定期自动备份到异地存储
- [ ] 备份文件加密存储

### 17.4 应用安全

- [ ] `NEXTAUTH_SECRET` 使用强随机字符串（`openssl rand -base64 32`）
- [ ] 所有 API Key 通过环境变量注入，不硬编码
- [ ] Stripe Webhook 签名验证已启用
- [ ] HTTPS 强制跳转（HTTP → 301 → HTTPS）
- [ ] 安全头已配置（HSTS, X-Frame-Options, X-Content-Type-Options 等）
- [ ] 文件上传大小限制（`client_max_body_size`）
- [ ] 生产环境禁用 `NEXT_PUBLIC_*` 暴露敏感信息
- [ ] 构建产物 `.next/` 和 `.env` 文件不应被公网访问

### 17.5 监控告警（尽早发现入侵）

- [ ] 配置 PM2 内存重启阈值（`max_memory_restart: "1G"`）
- [ ] 设置磁盘使用率告警（>80%）
- [ ] 监控 SSL 证书到期时间
- [ ] 配置 500 错误告警
- [ ] 监控 CPU 异常飙高（挖矿程序特征）
- [ ] 监控异常出站连接（矿池域名/IP）
- [ ] 建议安装 `netdata` 或 `prometheus + node_exporter` 实时监控

### 17.6 紧急响应流程（检测到入侵时）

```bash
# 1. 立即切断网络
sudo ufw deny out to any
sudo ufw deny in to any

# 2. 备份数据
pg_dump -U orient_user orient_beauty > /backup/emergency-$(date +%Y%m%d).sql

# 3. 停止应用
pm2 delete orient-beauty

# 4. 全面排查（见 17.2 节）
# 5. 确认无法彻底清除后 → 重装系统
# 6. 重装后：
#    - 更换所有密码和 API Key
#    - 更换 SSH 密钥对
#    - 使用本 checklist 逐条确认安全配置
```

> **核心原则**: 一旦确认被植入挖矿木马或 rootkit，**最安全的方式是重装系统**。手动清理无法保证 100% 清除，特别是 kernel 级别或 LD_PRELOAD 类型的后门。

---

## 18. SEO 优化部署指南

### 18.1 结构化数据 (JSON-LD)

项目已内置完整的 JSON-LD 结构化数据，部署后必须验证：

| 页面 | Schema 类型 | 来源文件 |
|------|------------|---------|
| 全局 (所有页面) | Organization, Website, LocalBusiness, Brand | `src/app/layout.tsx` |
| 产品详情 | Product, BreadcrumbList, HowTo, Article, VideoObject | `src/app/(shop)/products/[slug]/page.tsx` |
| 博客文章 | BlogPosting, BreadcrumbList, Article, Person | `src/app/(shop)/blog/[slug]/page.tsx` |
| 分类页 | ProductGroup, BreadcrumbList | `src/app/(shop)/categories/[slug]/page.tsx` |
| FAQ | FAQPage, QAPage, BreadcrumbList | `src/app/(shop)/faq/page.tsx` |
| 关于我们 | AboutPage, BreadcrumbList | `src/app/(shop)/about/page.tsx` |
| 联系我们 | ContactPage, BreadcrumbList | `src/app/(shop)/contact/page.tsx` |

#### 验证工具

部署后使用以下工具验证每项:

```bash
# Google Rich Results Test
# 访问: https://search.google.com/test/rich-results
# 输入你的页面 URL 逐一测试

# Schema.org Validator
# 访问: https://validator.schema.org/

# Google Search Console - URL Inspection
# 提交页面后查看 "富媒体搜索结果" 标签
```

#### 常见问题

- **JSON-LD 重复**: 确保每页的 schema 数组不重复添加相同的 `@type`
- **ProductGroup 验证**: `productGroupSchema` 要求每个 variant 有唯一的 sku
- **Organization 信息**: 确保 `src/lib/seo/structured-data.ts` 中的联系信息准确

### 18.2 Sitemap

项目自动生成 `/sitemap.xml`，包含所有 23+ 路由:

```bash
# 部署后验证
curl https://orientalbeauty.com/sitemap.xml | head -50

# 检查 sitemap 索引
curl https://orientalbeauty.com/sitemap.xml | grep -o "<loc>[^<]*</loc>"
```

#### 提交到搜索引擎

```bash
# Google Search Console
# 1. 访问 https://search.google.com/search-console
# 2. 添加域名 (输入 orientalbeauty.com)
# 3. 验证所有权 (推荐: DNS TXT 记录)
# 4. 左侧菜单 → Sitemaps → 输入 sitemap.xml → 提交

# Bing Webmaster Tools
# 1. 访问 https://www.bing.com/webmasters/
# 2. 添加站点
# 3. 验证所有权 (可导入 Google Search Console 验证)
# 4. 输入 sitemap.xml → 提交

# 手动 Ping
curl "https://www.google.com/ping?sitemap=https://orientalbeauty.com/sitemap.xml"
curl "https://www.bing.com/ping?sitemap=https://orientalbeauty.com/sitemap.xml"
```

### 18.3 Robots.txt

`/robots.txt` 位于 `src/app/robots.ts`，自动生成。部署后验证:

```bash
curl https://orientalbeauty.com/robots.txt
```

预期输出包含:
```
User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /_next/

User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /_next/

Sitemap: https://orientalbeauty.com/sitemap.xml
```

### 18.4 Meta 标签检查清单

部署后对所有模板页面进行检查:

| 标签 | 说明 | 检查方法 |
|------|------|---------|
| `<title>` | 每页唯一标题 | 浏览器标签栏 |
| `<meta name="description">` | 每页唯一描述 | 查看页面源码 |
| `<meta name="keywords">` | 相关关键词 | 查看页面源码 |
| `<link rel="canonical">` | 规范 URL，无重复内容 | 查看页面源码 |
| `<meta property="og:title">` | 社交分享标题 | Facebook Sharing Debugger |
| `<meta property="og:image">` | 社交分享图片 | Facebook Sharing Debugger |
| `<meta name="robots">` | 索引指令 | 查看页面源码 |
| `<meta name="google-site-verification">` | Google 验证 | Search Console |

```bash
# 批量检查所有页面的 meta 标签
cat << 'SCRIPT' > /tmp/check-meta.sh
#!/bin/bash
URLS=(
  "https://orientalbeauty.com"
  "https://orientalbeauty.com/products"
  "https://orientalbeauty.com/products/peptide-hydration-serum"
  "https://orientalbeauty.com/categories/beauty"
  "https://orientalbeauty.com/blog"
  "https://orientalbeauty.com/about"
  "https://orientalbeauty.com/contact"
  "https://orientalbeauty.com/faq"
)

for url in "${URLS[@]}"; do
  echo "=== $url ==="
  curl -s "$url" | grep -E "<title|<meta name=\"description\"|<link rel=\"canonical\""
  echo ""
done
SCRIPT
chmod +x /tmp/check-meta.sh && bash /tmp/check-meta.sh
```

### 18.5 Core Web Vitals 优化

部署后使用以下工具监控:

```bash
# Lighthouse 评分
# Chrome DevTools → Lighthouse → Generate report
# 目标: Performance ≥ 90, SEO = 100

# PageSpeed Insights
# 访问: https://pagespeed.web.dev/ (输入页面 URL)

# Google Search Console → Core Web Vitals
# 监控 LCP (< 2.5s), FID (< 100ms), CLS (< 0.1)
```

#### Nginx 缓存优化 (已配置)

```nginx
# 已在 Nginx 配置中启用:
# - 静态资源缓存 365 天 (/_next/static/)
# - 静态文件缓存 30 天 (/static/)
# - Gzip 压缩
```

#### 图片优化

```bash
# 项目使用 next/image 自动优化
# 确保已安装 sharp (生产环境必须)
npm list sharp  # 应显示 sharp 已安装
```

### 18.6 SEO 部署 Checklist

- [ ] Google Search Console 添加域名并验证
- [ ] Bing Webmaster Tools 添加站点并验证
- [ ] sitemap.xml 提交到 Google 和 Bing
- [ ] robots.txt 可访问且内容正确
- [ ] 所有页面的 JSON-LD 通过 Rich Results Test
- [ ] 所有页面有唯一的 title 和 description
- [ ] 所有页面有正确的 canonical URL
- [ ] Open Graph 标签 (og:title, og:image, og:description) 正常工作
- [ ] 网站验证代码 (`google-site-verification`, `msvalidate.01`) 已注入
- [ ] hreflang 标签配置正确 (如有多种语言)
- [ ] Core Web Vitals 达到绿色指标
- [ ] 移动端适配测试通过

---

## 19. GEO (生成式引擎优化) 部署指南

### 19.1 什么是 GEO

**GEO (Generative Engine Optimization)** 是针对 AI 生成式搜索引擎（如 ChatGPT Search, Google AI Overviews, Perplexity, Bing Copilot 等）的优化策略。与传统 SEO 不同，GEO 目标是让 LLM 在生成回答时优先引用你的品牌内容。

### 19.2 本项目已实现的 GEO 策略

#### 品牌实体构建

在 `src/lib/seo/structured-data.ts` 中的 `GEO_CONFIG` 包含了:

```typescript
export const GEO_CONFIG = {
  brandFacts: `...`,    // 品牌关键事实 (集中呈现)
  brandQuestions: [...]  // 常见品牌问答
}
```

**部署后效果**:
- **FAQ 页面**: 每个品牌问答作为独立的 `QAPage` schema 注入，LLM 可直接匹配用户查询
- **隐藏的品牌事实**: 使用 `sr-only` 类（屏幕阅读器可见，视觉隐藏），供 LLM 爬取时抓取
- **Brand schema**: 布局全局注入，包含品牌描述的语义化实体

#### Speakable 规范 (博客文章)

博客文章 (`src/app/(shop)/blog/[slug]/page.tsx`) 配置了 `SpeakableSpecification`:

```typescript
speakable: {
  cssSelector: [".blog-content h1", ".blog-content h2", ".blog-content blockquote"]
}
```

这告诉 LLM 哪些内容是文章的"可引用段落"——AI 引擎更倾向引用标记为 speakable 的内容。

#### 实体权威性信号

| 信号 | 实现方式 | 目标 |
|------|---------|------|
| 作者权威 | 每篇文章注入 `Person` schema (jobTitle, knowsAbout) | LLM 识别内容作者专业性 |
| 品牌知识 | Brand schema + QAPage + brandFacts | 构建 LLM 的品牌实体理解 |
| 结构化产品数据 | Product + ProductGroup + HowTo + Article schema | LLM 在推荐产品时引用完整信息 |
| HowTo 步骤 | HowTo schema 包含步骤描述和时间 | LLM 回答"如何使用"类问题 |

### 19.3 验证 GEO 效果

```bash
# 1. 使用 ChatGPT Search 测试
# 提示词: "What does Oriental Beauty sell?"
# 提示词: "How to apply peptide serum?"
# 提示词: "Tell me about Oriental Beauty brand"

# 2. 使用 Perplexity 测试
# 搜索: "oriental beauty skincare products"
# 检查是否引用你的网站内容

# 3. Google AI Overviews
# 搜索品牌相关长尾关键词
# 观察 AI Overviews 是否引用你网站的结构化数据

# 4. 结构化数据测试
# 访问: https://search.google.com/test/rich-results
# 检查 QAPage, Speakable, HowTo, ProductGroup 等 schema
```

### 19.4 持续优化建议

```bash
# 1. 更新 brandFacts
# 文件: src/lib/seo/structured-data.ts → GEO_CONFIG.brandFacts
# 随产品线扩展及时更新品牌事实

# 2. 扩展 brandQuestions
# 添加用户最常问的 5-10 个问题
# 分析 Google Search Console 中的 "People also ask"

# 3. 添加更多 HowTo schema
# 每个护肤品都应配有 HowTo 步骤
# 在 products/[slug]/page.tsx 中的 howToSchema 调用处扩展

# 4. 维护 Blog 文章的 speakable 内容
# 确保 h1/h2/blockquote 包含有价值的引用段落
# 避免在文章标题中使用点击诱饵

# 5. 监控 LLM 引用
# 定期在 ChatGPT/Perplexity 搜索品牌关键词
# 确保持续被 AI 引擎引用
```

### 19.5 GEO 部署 Checklist

- [ ] Brand schema 在全局布局中注入 (`layout.tsx`)
- [ ] FAQ 页面包含 QAPage schema + brandFacts 隐藏内容
- [ ] 博客页面包含 articleSchema + personSchema + speakable 规范
- [ ] 产品页面包含 howToSchema (护肤品) / articleSchema (手工品)
- [ ] 分类页面包含 ProductGroup schema
- [ ] brandFacts 和 brandQuestions 内容准确且完整
- [ ] 在 ChatGPT Search / Perplexity 中测试品牌可见性
- [ ] Google Rich Results Test 中所有 schema 无错误
- [ ] Brand knowledge `knowsAbout` 字段覆盖主要产品类别

---

## 20. CDN 加速与缓存策略

### 20.1 Cloudflare 推荐配置

推荐使用 **Cloudflare** 作为 CDN 和 DNS 提供商 (Free 计划即可满足需求)。

#### 步骤 1: 添加域名到 Cloudflare

```bash
# 1. 注册/登录 https://dash.cloudflare.com
# 2. 点击 "Add a Site" → 输入 orientalbeauty.com
# 3. 选择 Free 计划
# 4. Cloudflare 自动扫描 DNS 记录
# 5. 将域名的 Nameservers 改为 Cloudflare 提供的
```

#### 步骤 2: DNS 配置

| 类型 | 名称 | 值 | Proxy (橙色云朵) |
|------|------|-----|-----------------|
| A | `@` | 服务器 IP | Proxied |
| A | `www` | 服务器 IP | Proxied |
| CNAME | `*` | orientalbeauty.com | Proxied |

> **重要**: 所有记录必须开启 Proxy (橙色云朵) 才能启用 CDN 缓存和安全功能。

#### 步骤 3: SSL/TLS 配置

```bash
# Cloudflare Dashboard → SSL/TLS
# 推荐: Full (strict)
# - 需要服务器上有有效的 SSL 证书 (Let's Encrypt)
# - Cloudflare 到访客: HTTPS (Cloudflare 证书)
# - Cloudflare 到服务器: HTTPS (你的证书)
```

#### 步骤 4: 缓存规则

进入 Cloudflare Dashboard → **Caching** → **Cache Rules**，创建以下规则:

**规则 1 — 静态资源 (长期缓存)**

```
Field: Hostname → equals → orientalbeauty.com
AND Field: URI Path → contains → /_next/static/

Cache Eligibility: Eligible for cache
Edge TTL: 365 days
Browser TTL: 365 days
```

**规则 2 — 图片资源**

```
Field: Hostname → equals → orientalbeauty.com
AND Field: URI Path → contains → /static/

Cache Eligibility: Eligible for cache
Edge TTL: 30 days
Browser TTL: 30 days
```

**规则 3 — HTML 页面 (短期缓存)**

```
Field: Hostname → equals → orientalbeauty.com
AND Field: URI Path → equals → /*
AND NOT Field: URI Path → starts with → /_next/
AND NOT Field: URI Path → starts with → /api/

Cache Eligibility: Eligible for cache
Edge TTL: 10 minutes
Browser TTL: 10 minutes
```

> **注意**: 对于 Next.js 应用，HTML 页面缓存时间不宜过长，否则用户看到的内容可能不是最新的。如需要实时内容，可将 HTML 设置为 `No cache`。

#### 步骤 5: Page Rules (可选，Free 计划限 3 条)

进入 Cloudflare Dashboard → **Rules** → **Page Rules**:

```
# 规则 1: 静态资源缓存
Pattern: orientalbeauty.com/_next/static/*
Setting: Cache Level → Standard + Edge Cache TTL → 365 days

# 规则 2: 始终使用 HTTPS
Pattern: orientalbeauty.com/*
Setting: Always Use HTTPS → ON

# 规则 3: 自动缩小化
Pattern: orientalbeauty.com/*
Setting: Auto Minify (HTML/CSS/JS) → ON
```

### 20.2 Cloudflare 速度优化

进入 Cloudflare Dashboard → **Speed** → **Optimization**:

```bash
# 开启以下功能:
# ✅ Auto Minify (HTML, CSS, JavaScript)
# ✅ Brotli (比 Gzip 压缩率更高)
# ✅ Early Hints (预加载资源)
# ✅ Rocket Loader (JS 异步加载)
# ✅ Polish (图片压缩, 选择 Lossless)
# ✅ HTTP/2 和 HTTP/3 (默认开启)
```

#### 图片优化 (Cloudflare Polish)

```bash
# Cloudflare Polish 配置:
# - Lossless: 无损压缩 (推荐，保持画质)
# - Lossy: 有损压缩 (更高压缩率)
# - WebP: 自动转换为 WebP 格式 (需配合 Cache Rules)
```

### 20.3 安全配置

#### WAF (Web Application Firewall)

```bash
# Cloudflare Dashboard → Security → WAF
# 开启:
# ✅ Bot Fight Mode (防御爬虫)
# ✅ Browser Integrity Check (验证浏览器)
# ✅ Security Level → Medium 或 High
# ✅ Challenge Passage → 30 minutes
```

#### 速率限制

```bash
# Cloudflare Dashboard → Security → Rate Limiting
# 创建规则:
# - API 路径: /api/* → 100 请求 / 10 秒
# - 登录路径: /api/auth/* → 5 请求 / 60 秒
```

### 20.4 Nginx 端配合

即使使用 Cloudflare，Nginx 端也需要优化:

```bash
# 1. 获取 Cloudflare 真实 IP
sudo nano /etc/nginx/conf.d/cloudflare.conf
```

```nginx
# Cloudflare IP 范围 (定期更新，参见 https://www.cloudflare.com/ips/)
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
real_ip_header X-Forwarded-For;
```

```bash
# 2. 如果是 Cloudflare Full (strict)，Nginx 也需要监听 443
#    并配置有效的 Let's Encrypt 证书 (Cloudflare 回源使用)
#    具体见第 6 节 SSL 证书

# 3. 重新加载 Nginx
sudo nginx -t && sudo systemctl reload nginx
```

#### 自动更新 Cloudflare IP

```bash
# 创建定时任务，每周更新 Cloudflare IP 列表
cat > /usr/local/bin/update-cloudflare-ips.sh << 'EOF'
#!/bin/bash
CF_IPV4=$(curl -s https://www.cloudflare.com/ips-v4)
CF_IPV6=$(curl -s https://www.cloudflare.com/ips-v6)

CONF="/etc/nginx/conf.d/cloudflare.conf"

echo "# Cloudflare IP ranges (updated: $(date))" > $CONF
echo "$CF_IPV4" | while read ip; do
  echo "set_real_ip_from $ip;" >> $CONF
done
echo "$CF_IPV6" | while read ip; do
  echo "set_real_ip_from $ip;" >> $CONF
done
echo "real_ip_header X-Forwarded-For;" >> $CONF

nginx -t && systemctl reload nginx
EOF

chmod +x /usr/local/bin/update-cloudflare-ips.sh

# 添加到 crontab (每周一凌晨 2 点执行)
crontab -e
0 2 * * 1 /usr/local/bin/update-cloudflare-ips.sh
```

### 20.5 多 CDN 备选方案

| CDN | 计划 | 适用场景 | 备注 |
|-----|------|---------|------|
| Cloudflare | Free / $20 Pro | 通用最佳选择 | DNS + CDN + WAF 一体 |
| BunnyCDN | $1+/月 | 亚太地区加速 | 按量付费，亚太节点多 |
| Amazon CloudFront | 按量付费 | AWS 生态 | 与 S3 配合使用 |
| Fastly | $50+/月 | 企业级性能 | 即时缓存清除，高并发 |

#### 使用 BunnyCDN 作为亚太加速 (可选)

如果大部分客户在亚太地区，可搭配 BunnyCDN:

```bash
# 1. 注册 BunnyCDN (https://bunny.net)
# 2. 创建 Pull Zone
#    - Origin URL: https://orientalbeauty.com
#    - Type: Performance (全球包含亚太节点)

# 3. 静态资源通过 BunnyCDN 分发
#    在 next.config.ts 中配置 assetPrefix:
#    assetPrefix: "https://oriental-beauty.b-cdn.net"

# 4. DNS 配置 CNAME 到 BunnyCDN
#    cdn.orientalbeauty.com → orient-beauty.b-cdn.net
```

### 20.6 CDN 部署 Checklist

- [ ] Cloudflare DNS 所有记录已开启 Proxy
- [ ] SSL/TLS 设置为 Full (strict)
- [ ] Cache Rules 已配置 (静态资源 365 天，HTML 10 分钟)
- [ ] 自动最小化 (Auto Minify) 已开启
- [ ] Brotli 压缩已开启
- [ ] Nginx 已配置 Cloudflare 真实 IP
- [ ] Nginx 已配置 SSL 证书用于 Cloudflare 回源
- [ ] 速率限制已配置 (API 和登录路径)
- [ ] WAF 安全功能已开启
- [ ] Google / Bing 爬虫可正常抓取
- [ ] Core Web Vitals 达到绿色指标
- [ ] 可选: 亚太地区使用 BunnyCDN 加速

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

见 [第 20 节 — CDN 加速与缓存策略](#20-cdn-加速与缓存策略)。

---

## 21. 管理后台部署指南

### 21.1 管理后台概述

系统内置了一个完整的管理后台，路径为 `/admin`。管理员可以在后台管理：

| 功能 | 路径 | 说明 |
|------|------|------|
| Dashboard | `/admin` | 数据概览（收入、订单数、产品数等） |
| 产品管理 | `/admin/products` | 查看产品列表、库存和状态 |
| 订单管理 | `/admin/orders` | 查看订单详情、支付和物流状态 |
| 客户管理 | `/admin/customers` | 查看注册用户及订单/评价统计 |
| 博客管理 | `/admin/blog` | 管理博客文章和评论 |
| 营销工具 | `/admin/marketing` | 优惠券和邮件营销配置 |
| 联盟管理 | `/admin/affiliates` | 查看和管理联盟合作伙伴 |
| 横幅管理 | `/admin/banners` | 管理首页横幅广告 |
| 分析工具 | `/admin/analytics` | 数据分析和流量统计 |
| 系统设置 | `/admin/settings` | 商店名称、邮件、货币等设置 |

### 21.2 初始化管理员账号

首次部署后，需要运行种子脚本创建管理员账号：

```bash
cd /var/www/orient-beauty

# 运行种子脚本
npm run db:seed
```

**默认管理员凭据：**

| 字段 | 值 |
|------|-----|
| 邮箱 | `81570423@qq.com` |
| 密码 | `Admin123!` |

> **重要**：部署到生产环境后，请立即修改默认密码。

### 21.3 创建更多管理员

通过 Prisma Studio 或直接在数据库中创建：

```bash
# 方式一：Prisma Studio (图形界面)
npx prisma studio
# → 找到 User 表 → 点击 "Add Record"
# → 填写 email、passwordHash (需 bcrypt 加密)、role 设为 ADMIN

# 方式二：直接在数据库插入
# 先获取 bcrypt 加密的密码
node -e "console.log(require('bcryptjs').hashSync('YourPassword123!', 12))"

# 然后在 PostgreSQL 中执行:
# INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", role)
# VALUES (gen_random_uuid(), 'admin2@orientalbeauty.com', '上述hash值', 'Admin2', 'Oriental Beauty', 'ADMIN');
```

### 21.4 修改管理员密码

管理员登录后，可以通过以下方式修改密码：

```bash
# 方式一：通过 Prisma Studio
npx prisma studio
# → User 表 → 找到管理员 → 修改 passwordHash

# 方式二：直接 SQL
# 先获取新密码的 bcrypt hash
NEW_HASH=$(node -e "console.log(require('bcryptjs').hashSync('NewPassword123!', 12))")
# 执行更新
sudo -u postgres psql -d orient_beauty -c "UPDATE users SET \"passwordHash\"='$NEW_HASH' WHERE email='81570423@qq.com';"
```

### 21.5 管理后台安全配置

#### 环境变量

```bash
# .env (确保以下配置正确)
NEXTAUTH_SECRET="your-strong-random-secret"   # 用于加密 session token
NEXTAUTH_URL="https://orientalbeauty.com"      # 必须与部署 URL 一致
```

> `NEXTAUTH_SECRET` 应使用强随机字符串生成：`openssl rand -base64 32`

#### 中间件保护

所有 `/admin/*` 路径由 `src/middleware.ts` 保护：

- **未登录用户**：自动重定向到登录页 `/auth/signin`
- **非管理员用户**（已登录但 role !== ADMIN）：重定向到首页 `/`
- **管理员用户**：正常访问

#### 双重验证

即使中间件已拦截非管理员请求，每个管理页面在服务端也会通过 `getServerAuthSession()` 再次校验管理员身份，防止绕过中间件的直接访问。

### 21.6 管理后台访问

部署完成后，通过以下地址访问：

```
https://orientalbeauty.com/admin
```

使用管理员邮箱和密码登录（如尚未登录，会先跳转到登录页）。

### 21.7 管理后台部署 Checklist

  - [ ] 运行 `npm run db:seed` 创建管理员账号（`prisma.config.ts` 会加载 `.env` 中的 `DATABASE_URL`）
- [ ] 登录 `/admin` 验证管理后台可正常访问
- [ ] 修改默认管理员密码
- [ ] 确认 `NEXTAUTH_SECRET` 已设置为强随机字符串
- [ ] 确认 `NEXTAUTH_URL` 为生产环境 URL
- [ ] 验证非管理员用户无法访问 `/admin`
- [ ] 验证未登录用户无法访问 `/admin`
- [ ] 验证 admin dashboard 统计数据显示正常
- [ ] 验证产品列表、订单列表、客户列表可正常加载

---

### C. 性能优化

```bash
# 启用 Next.js 输出文件追踪 (减小部署体积)
# next.config.ts 已配置 output: "standalone"
# 注意: standalone 模式必须运行 .next/standalone/server.js，不能用 next start

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
