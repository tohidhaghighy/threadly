# Threadly backend (NestJS)

## Stack

- NestJS
- TypeORM
- SQLite
- JWT (Bearer token)

## Setup

From repo root:

```bash
npm run backend:install
```

## Run (dev)

```bash
npm run backend:dev
```

Backend defaults:

- Base URL: `http://localhost:3001`
- SQLite DB file: `backend/threadly.sqlite` (configurable via `DB_PATH`)
- Uploads: `backend/uploads/` served at `/uploads`

## Environment variables (optional)

- `PORT` (default `3001`)
- `DB_PATH` (default `threadly.sqlite`)
- `JWT_SECRET` (default `dev-secret-change-me`)
- `JWT_EXPIRES_IN_SECONDS` (default `604800`)

