# Commodities From China — E-commerce Platform

A B2B/B2C e-commerce platform built with Next.js 15, featuring Stripe/PayPal payments, OpenAI AI customer-service chat, affiliate program, and admin dashboard.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

## Key Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed admin user & data |
| `npm run db:studio` | Open Prisma Studio |

## Deployment

Single supported path: system Node.js + PM2 + system Nginx + PostgreSQL. No Docker files are kept in this repo.

- [Deployment guide](docs/DEPLOYMENT.md) — the full production flow, currently in production
- [Operations & reference](docs/OPERATIONS.md) — monitoring, backups, env vars, payments, SEO/GEO, admin setup
- [Incident recovery](docs/INCIDENT-RECOVERY.md) — server compromise checklist
