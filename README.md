Safile
Decentralized EHR backup and patient record encryption for resource-constrained healthcare facilities.
Safile encrypts patient records client-side (AES-256-GCM) and stores them immutably on decentralized Sia storage via indexd, providing hospitals and clinics with cost-effective, censorship-resistant backup without infrastructure overhead. Built for low-bandwidth environments and underserved healthcare systems.
Overview
Safile is a full-stack admin dashboard and API for hospital IT teams to manage encrypted electronic health record (EHR) backups. It handles:
EHR connectors — bridge to OpenMRS, Bahmni, DHIS2, Epic, and custom systems
Client-side encryption — AES-256-GCM with hospital-retained key custody
Decentralized storage — patient records backed up to Sia via indexd gateways
Compliance auditing — backup history, record verification, key rotation logs
Multi-facility management — ward-level statistics and snapshot tracking
Design principle: Patient data never leaves hospital networks unencrypted. Keys remain on-premise. Sia provides immutable, redundant storage at a fraction of traditional cloud costs.
Architecture
Safile is a pnpm workspace monorepo using TypeScript, designed for modular scaling and type safety across frontend, backend, and database layers.
safile/
├── artifacts/
│   ├── safile-dashboard/       # React + Vite frontend (admin UI)
│   └── api-server/              # Express 5 API handlers
├── lib/
│   ├── db/                       # PostgreSQL + Drizzle schema
│   ├── api-spec/                 # OpenAPI 3.1 spec (single source of truth)
│   ├── api-client-react/         # Generated React Query hooks
│   ├── api-zod/                  # Generated Zod validation schemas
│   └── shared/                   # Types, constants, utilities
└── pnpm-workspace.yaml
Tech Stack
Layer
Tech
Version
Frontend
React + Vite + Wouter
React 18
Backend
Express 5
Node.js 24
Database
PostgreSQL + Drizzle ORM
Latest
API Contract
OpenAPI 3.1 + Orval codegen
Spec-driven
Validation
Zod + drizzle-zod
v4
Charts
Recharts
—
Build
esbuild (CJS)
—
Package Manager
pnpm
Latest
Database Schema
Core Tables
ehr_connectors — EHR system integrations
id — unique connector ID
facility_id — parent hospital/clinic
type — OpenMRS, Bahmni, DHIS2, Epic, Custom
endpoint — EHR API endpoint
auth_method — OAuth2, Basic, Custom header
last_sync — timestamp of last successful connection test
status — active, paused, error
encryption_keys — Key metadata (keys stored on-premise)
id — key identifier
facility_id — issuing facility
algorithm — AES-256-GCM
created_at — key generation timestamp
rotated_at — last rotation date
status — active, rotated, archived
hash — SHA-256 of public key metadata
indexd_nodes — Sia storage gateways
id — node ID
facility_id — managing facility
endpoint — Sia S3-compatible endpoint
access_key / secret_key — stored encrypted
region — Sia region/silo
status — healthy, unhealthy, offline
last_health_check — timestamp
backup_snapshots — Backup run history
id — snapshot ID
facility_id — originating facility
ehr_connector_id — source system
started_at / completed_at — run timestamps
status — queued, running, succeeded, failed, partial
total_records — patient count
encrypted_size_bytes — ciphertext size on Sia
record_hash — SHA-256 verification hash
backup_records — Individual patient records
id — record ID
snapshot_id — parent backup
patient_id_hash — HMAC of patient ID (PII not stored)
record_type — encounter, lab, vital, medication, note
encrypted_payload — AES-256-GCM ciphertext
sia_object_key — Sia storage location
hash_verification — SHA-256 of plaintext
indexed_at — timestamp when indexed on Sia
API Routes
EHR Connectors
GET    /api/ehr-connectors              List all connectors
POST   /api/ehr-connectors              Create new connector
GET    /api/ehr-connectors/:id          Get connector details
PATCH  /api/ehr-connectors/:id          Update connector config
DELETE /api/ehr-connectors/:id          Remove connector
POST   /api/ehr-connectors/:id/test     Test auth + connectivity
Backups
GET    /api/backups                     List snapshots
POST   /api/backups                     Trigger new backup
GET    /api/backups/:id                 Get snapshot details
GET    /api/backups/:id/records         List records in snapshot
Encryption Keys
GET    /api/keys                        List active keys
POST   /api/keys                        Generate new key
POST   /api/keys/:id/rotate             Rotate key (archive old, create new)
GET    /api/keys/:id/audit              Key rotation audit log
Storage Nodes
GET    /api/indexd-nodes                List Sia gateways
POST   /api/indexd-nodes                Register new node
DELETE /api/indexd-nodes/:id            Remove node
GET    /api/indexd-nodes/:id/status     Live health check + stats
Dashboard Stats
GET    /api/stats/summary               KPIs: total facilities, records, storage cost
GET    /api/stats/backup-trend          30-day backup success rate + record growth
GET    /api/stats/ward-coverage         Patient records per ward/department
Development
Prerequisites
Node.js 24 (download)
pnpm (npm install -g pnpm)
PostgreSQL 14+ (local or remote)
Docker (optional, for containerized Postgres)
Setup
Clone and install:
git clone https://github.com/yucky-dev/safile.git
cd safile
pnpm install
Configure environment:
Create a .env.local file in the project root:
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/safile_dev

# API Server
API_PORT=3000
API_HOST=localhost

# Frontend (Vite dev server)
VITE_API_URL=http://localhost:3000

# Sia / indexd (optional for local dev)
INDEXD_ENDPOINT=https://indexd.sia.tech
Initialize database:
pnpm --filter @workspace/db run push
Start development servers:
# Terminal 1: API server
pnpm --filter @workspace/api-server run dev

# Terminal 2: Frontend dev server
pnpm --filter @workspace/safile-dashboard run dev
Frontend runs on http://localhost:5173 | API runs on http://localhost:3000
Key Commands
# Type checking across all packages
pnpm run typecheck

# Build all packages (production)
pnpm run build

# Regenerate API hooks & Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push database schema changes (dev only)
pnpm --filter @workspace/db run push

# Lint (if configured)
pnpm run lint
API Specification
The API contract is defined in OpenAPI 3.1 (lib/api-spec/openapi.yaml). This is the single source of truth for:
Route definitions
Request/response schemas
Authentication
Error codes
Code generation: Running pnpm --filter @workspace/api-spec run codegen regenerates:
lib/api-client-react/ — React Query hooks for frontend
lib/api-zod/ — Zod schemas for validation
This ensures frontend and backend stay in sync.
Deployment
Docker
A Dockerfile is provided for containerization:
# Build image
docker build -t safile:latest .

# Run with environment variables
docker run -e DATABASE_URL=postgresql://... \
           -e API_PORT=3000 \
           -p 3000:3000 \
           safile:latest
Production Checklist
[ ] Set NODE_ENV=production
[ ] Use strong database credentials + SSL
[ ] Enable CORS for frontend domain only
[ ] Rotate encryption keys monthly
[ ] Monitor Sia node health (run /api/indexd-nodes/:id/status hourly)
[ ] Backup PostgreSQL database daily
[ ] Enable audit logging for all key rotations and EHR sync events
[ ] Test disaster recovery (restore from Sia backup)
Security
Encryption Model
Client-side encryption: Patient records encrypted in the hospital's frontend before transmission
Algorithm: AES-256-GCM (256-bit key, 128-bit tag, random IV)
Key custody: Encryption keys never transmitted to Safile servers; stored on-premise in hospital HSM or secure vault
Storage: Encrypted ciphertext stored on Sia; decryption keys remain offline
Verification: SHA-256 hashes allow integrity checks without decryption
Compliance
HIPAA-aligned (encryption in transit + at rest, audit logs, access control)
GDPR-compatible (patient data deletion via key rotation + Sia object removal)
No patient PII stored on Safile servers (only hashes, metadata, timestamps)
Roadmap
[ ] Multi-factor authentication (MFA) for admin dashboards
[ ] Role-based access control (RBAC) per facility/department
[ ] Real-time backup streaming (vs. batch snapshots)
[ ] Web3 wallet integration for censorship-resistant key escrow
[ ] Automated disaster recovery testing
[ ] GraphQL API alternative
[ ] Mobile app for backup status monitoring
Contributing
Contributions welcome. Please:
Fork the repository
Create a feature branch (git checkout -b feature/your-feature)
Commit with clear messages
Open a pull request with description of changes
Code style: TypeScript, ESLint rules defined in repo. Run pnpm run typecheck before submitting.
Support
Issues: GitHub Issues for bugs and feature requests
Documentation: See /docs for architecture diagrams and integration guides
Email: support@safile.io (if applicable)
License
[Specify your license here, e.g., MIT, AGPL-3.0, Apache 2.0]
Acknowledgments
Built with:
Sia Foundation (decentralized storage)
indexd (S3 gateway for Sia)
OpenMRS, Bahmni, DHIS2 communities
Contributors: yucky-dev, replit-agent, and others
Last Updated: April 2026
Maintainer: Abuo Favour Opiah (@yucky-dev)
