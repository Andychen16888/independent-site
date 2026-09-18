# ===============================================================
# 多阶段构建: deps -> builder -> migrate (数据库迁移) -> runner
#
# 使用方式:
#   docker compose up -d --build
#   # 或仅构建镜像:
#   docker build -t b2b-independent-site .
#   docker build --target migrate -t b2b-migrate .
#
# 注意:
#   - NEXT_PUBLIC_* 变量在 "next build" 时被内联进客户端代码,
#     必须在构建阶段通过 --build-arg 传入 (compose 会自动从 .env 读取)。
#   - 构建阶段需要网络访问 (npm registry + 系统包), 建议在服务器上构建。
# ===============================================================

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED 1

# ---------- 依赖安装 ----------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ---------- 构建 ----------
FROM base AS builder
# NEXT_PUBLIC_* 为构建期变量 (Next.js 内联到客户端), 必须经 --build-arg 提供
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_PAYPAL_CLIENT_ID
ARG NEXT_PUBLIC_FACEBOOK_PIXEL_ID
ARG NEXT_PUBLIC_GOOGLE_ADS_ID
ARG NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID
ENV NEXT_PUBLIC_FACEBOOK_PIXEL_ID=$NEXT_PUBLIC_FACEBOOK_PIXEL_ID
ENV NEXT_PUBLIC_GOOGLE_ADS_ID=$NEXT_PUBLIC_GOOGLE_ADS_ID
ENV NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=$NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate && npm run build:server

# ---------- 数据库迁移 + 种子 (构建独立的 migrate 镜像) ----------
FROM builder AS migrate
ENV NODE_ENV production
CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed"]

# ---------- 运行时 (standalone) ----------
FROM base AS runner
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]