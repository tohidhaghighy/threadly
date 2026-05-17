# Threadly

Threadly is a modern community forum for PC builders (Persian-first UI) where users can post threads, reply with text/images, react, and earn points.

Powered by [tohidhaghighy/threadly](https://github.com/tohidhaghighy/threadly).

## Features

- **Threads**
  - Create threads with category + tags
  - Attach images to a thread
  - View counts + likes
  - Thread owner (and admin) can choose a **best answer**
  - Share link (native share / clipboard fallback)
  - Lazy/debounced live search on home page with inline results
- **Replies (comments)**
  - Post replies (with optional images)
  - Daily reply limit for regular users (admins unlimited)
  - Reactions on replies (+ points)
- **Users**
  - Leaderboard
  - User profile page showing points and activity history
  - Gamification: levels, progress bar, streak, and achievements
  - Avatar upload or choose from built-in samples
- **Notifications**
  - Header alerts for replies, mentions, and thread activity
  - Unread badge with per-user seen state
- **Admin panel**
  - Review/approve/reject threads
  - Manage categories
  - Manage users (role + ban)
  - Manage comments
  - Admin can do user actions (for example: best-answer moderation)
- **SEO**
  - Canonical + OpenGraph/Twitter tags
  - `robots.txt` + `sitemap.xml`
  - Dynamic sitemap at `/api/seo/sitemap.xml`

## Tech stack

- **Frontend**: React + TanStack Router + TanStack Query + Vite + Tailwind
- **Backend**: NestJS + TypeORM + SQLite + JWT auth
- **Uploads**: stored on disk (`backend/uploads`) and served from `/uploads`

## Default admin credentials

On backend startup, a deterministic admin user is created/updated by the seed logic:

- **Email**: `admin@threadly.com`
- **Password**: `threadly`

You can sign in at `/login`, then open `/admin`.

## Run locally (development)

### Prerequisites

- Node.js 18+ (recommended)
- npm

### 1) Install dependencies

From repo root:

```bash
npm install
npm run backend:install
```

### 2) Start backend

```bash
npm run backend:dev
```

Backend defaults:

- **API base**: `http://localhost:3001`
- **Swagger**: `http://localhost:3001/docs`
- **Uploads**: `http://localhost:3001/uploads/...`

### 3) Start frontend

In a second terminal:

```bash
npm run dev
```

Frontend defaults to Vite’s dev server (typically `http://localhost:5173`) and proxies `/api` and `/uploads` to the backend via `vite.config.ts`.

## Self-host (production)

Threadly is split into a frontend (static `dist/`) and a backend API.

### 1) Build

```bash
# frontend
npm install
npm run build

# backend
npm run backend:install
cd backend
npm run build
```

### 2) Configure environment variables

#### Backend (`backend/`)

- `PORT` (default: `3001`)
- `DB_PATH` (default: `threadly.sqlite`)
- `JWT_SECRET` (default: `dev-secret-change-me`) **change this in production**
- `JWT_EXPIRES_IN_SECONDS` (default: `604800`)

#### Frontend

- `VITE_PUBLIC_SITE_URL` (recommended): public site origin used for canonical/og:url generation in SSR-less contexts (example: `https://your-domain.com`)

### 3) Run backend

```bash
cd backend
node dist/main.js
```

### 4) Serve frontend + reverse proxy API

Serve the `dist/` directory via your web server (Nginx/Caddy/Apache/etc), and reverse-proxy:

- `/api/*` → backend (`http://127.0.0.1:3001`)
- `/uploads/*` → backend (`http://127.0.0.1:3001`)

This matches how the frontend calls the API (relative `/api/...`) and how uploads are referenced.

## Useful URLs

- **Home**: `/`
- **Threads**: `/threads`
- **Users leaderboard**: `/users`
- **Login/Register**: `/login`, `/register`
- **Settings**: `/settings`
- **Admin**: `/admin`
- **robots.txt**: `/robots.txt`
- **Static sitemap**: `/sitemap.xml`
- **Dynamic sitemap** (backend): `/api/seo/sitemap.xml`

