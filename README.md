# Threadly

Threadly is a modern community forum for PC builders (Persian-first UI) where users can post threads, reply with text/images, react, and earn points.

Powered by [tohidhaghighy/threadly](https://github.com/tohidhaghighy/threadly).

## Features

- **Threads** — categories, tags, images, views/likes, best answer, share
- **Replies** — images, daily limits, reactions + points
- **Users** — leaderboard, profile, gamification, avatars
- **Notifications** — replies, mentions, activity
- **Admin** — approve threads, categories, users, comments, SEO
- **PWA** — installable app + `/install` guide
- **SEO** — OG tags, robots, sitemap

## Tech stack

- **Frontend**: React + TanStack Router + TanStack Query + Vite + Tailwind
- **Backend**: NestJS + TypeORM + **Microsoft SQL Server** + JWT auth
- **Uploads**: `backend/uploads` served at `/uploads`

## Default admin credentials

- **Email**: `admin@threadly.com`
- **Password**: `threadly`

## SQL Server connection (SSMS)

Configure `DB_CONNECTION_STRING` in `backend/.env` (see `backend/.env.example`). Do not commit real credentials.

## Run locally (development)

### Prerequisites

- Node.js 18+
- npm
- Access to SQL Server (create empty DB `threadly-fater` in SSMS first)

### 1) Install

```bash
npm install
npm run backend:install
cd backend
cp .env.example .env
```

### 2) Backend

```bash
npm run backend:dev
```

- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/docs`
- Uploads: `http://localhost:3001/uploads/...`

### 3) Frontend

```bash
npm run dev
```

Vite proxies `/api` and `/uploads` to the backend.

## Self-host (production)

```bash
# frontend
npm install && npm run build

# backend
npm run backend:install
cd backend
cp .env.example .env   # set JWT_SECRET + DB_CONNECTION_STRING
npm run build
node dist/main.js
```

Reverse-proxy:

- `/api/*` → `http://127.0.0.1:3001`
- `/uploads/*` → `http://127.0.0.1:3001`

Environment highlights:

| Var | Notes |
|-----|--------|
| `DB_CONNECTION_STRING` | SQL Server ADO.NET string |
| `TYPEORM_SYNC` | `true` on first boot to create tables; prefer `false` after stable prod |
| `JWT_SECRET` | **must** change in production |

## Useful URLs

- Home `/` · Threads `/threads` · Users `/users` · Install `/install`
- Admin `/admin` · Login `/login` · Settings `/settings`
- Backend Swagger (dev only): `http://localhost:3001/docs`
