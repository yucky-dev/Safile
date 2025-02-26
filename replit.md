# SAFILE Dashboard

## Overview

SAFILE is a hospital EHR backup platform that encrypts patient records client-side (AES-256-GCM) and stores them on decentralized Sia storage via indexd. This is the full-stack admin dashboard for hospital IT/compliance teams.

## Architecture

pnpm workspace monorepo using TypeScript.

- **Frontend**: React + Vite (`artifacts/safile-dashboard`) — dashboard, connectors, backups, keys, storage nodes
- **Backend**: Express 5 API server (`artifacts/api-server`) — all SAFILE route handlers
- **Database**: PostgreSQL + Drizzle ORM (`lib/db`)
- **API contract**: OpenAPI 3.1 spec in `lib/api-spec/openapi.yaml`
- **Generated code**: React Query hooks in `lib/api-client-react`, Zod schemas in `lib/api-zod`

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend charts**: Recharts
- **Routing**: Wouter

## Database Tables

- `ehr_connectors` — hospital EHR system connections (OpenMRS, Bahmni, DHIS2, Epic, Custom)
- `encryption_keys` — AES-256-GCM key metadata (keys themselves remain hospital-side)
- `indexd_nodes` — Sia storage gateway nodes
- `backup_snapshots` — backup run history with status, record counts, sizes
- `backup_records` — individual patient records within each backup, with hash verification

## API Routes

- `GET/POST /api/ehr-connectors` — list/create connectors
- `GET/PATCH/DELETE /api/ehr-connectors/:id` — manage connector
- `POST /api/ehr-connectors/:id/test` — test EHR auth
- `GET/POST /api/backups` — list backups, trigger backup
- `GET /api/backups/:id` — get snapshot
- `GET /api/backups/:id/records` — list patient records in snapshot
- `GET/POST /api/keys` — list/generate encryption keys
- `POST /api/keys/:id/rotate` — rotate key
- `GET/POST /api/indexd-nodes` — list/add Sia nodes
- `DELETE /api/indexd-nodes/:id` — remove node
- `GET /api/indexd-nodes/:id/status` — live health check
- `GET /api/stats/summary` — dashboard KPIs
- `GET /api/stats/backup-trend` — 30-day backup trend
- `GET /api/stats/ward-coverage` — records per ward

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
