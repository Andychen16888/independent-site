# Generic B2B/B2C E-commerce Platform

A white-label e-commerce platform built with Next.js 15, featuring Stripe/PayPal payments, OpenAI AI customer-service chat, affiliate program, and admin dashboard.

> Replace the placeholders before deploying: `your-domain.com` (your domain), `Your Company` (your brand), and `admin@example.com` (your admin email). Site name and homepage content can be changed later in `/admin/settings`.

## Quick Start

```bash
npm ci --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

See the placeholder table at the top of [docs/通用独立站%20DEPLOYMENT.md](docs/通用独立站%20DEPLOYMENT.md) for the full list.

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

- [Deployment guide](docs/通用独立站%20DEPLOYMENT.md) — the full production flow
- [Operations & reference](docs/OPERATIONS.md) — monitoring, backups, env vars, payments, SEO/GEO, admin setup
- [Incident recovery](docs/INCIDENT-RECOVERY.md) — server compromise checklist
