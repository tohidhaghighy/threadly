# Threadly backend (NestJS)

## Stack

- NestJS
- TypeORM
- **Microsoft SQL Server** (SSMS / TDS)
- JWT (Bearer token)

## Setup

From repo root:

```bash
npm run backend:install
```

Copy env file:

```bash
cd backend
cp .env.example .env
```

## SQL Server connection

Set `DB_CONNECTION_STRING` in `backend/.env` (copy from `.env.example`). Do not commit real credentials.

Create an empty database in SSMS first (e.g. `threadly-fater`). With `TYPEORM_SYNC=true` the API creates tables on first boot.

### Persian / Unicode text

All string columns use **nvarchar** (not varchar). If older data shows as `?????`, convert existing columns then re-seed content (corrupted characters cannot be recovered):

```bash
cd backend
npm run db:fix-unicode
npm run db:reseed-persian
```

## Run (dev)

```bash
npm run backend:dev
```

Backend defaults:

- Base URL: `http://localhost:3001`
- Swagger: `http://localhost:3001/docs`
- Uploads: `backend/uploads/` served at `/uploads`

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `DB_CONNECTION_STRING` | — | ADO.NET SQL Server string (required unless split vars set) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | — | Alternative to connection string |
| `DB_TRUST_SERVER_CERTIFICATE` | `true` | Trust SQL Server cert |
| `DB_ENCRYPT` | `true` | Encrypt TDS |
| `TYPEORM_SYNC` | `true` | Sync schema on boot |
| `JWT_SECRET` | `dev-secret-change-me` | **Change in production** |
| `JWT_EXPIRES_IN_SECONDS` | `604800` | Token TTL |
| `SEED_DEMO_DATA` | `false` | Seed demo threads |

## Useful scripts

```bash
npm run db:seed-faq
npm run db:clear
npm run db:import-sqlite   # load backend/server-threadly.sqlite into SQL Server
```
