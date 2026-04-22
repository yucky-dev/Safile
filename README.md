
🏥 Safile
Decentralized EHR Backup & Patient Record Encryption
Safile enables hospitals and clinics to securely back up patient records without relying on expensive or trust-heavy cloud infrastructure.
It encrypts data before it leaves the hospital and stores it on decentralized Sia storage, ensuring privacy, integrity, and resilience.
✨ Overview
Safile is a full-stack dashboard and API that helps healthcare teams:
🔗 Connect to EHR systems (OpenMRS, DHIS2, Epic, custom)
🔐 Encrypt patient data client-side (AES-256-GCM)
☁️ Store backups on decentralized Sia storage
📊 Track backups, audits, and system health
🏥 Manage multiple facilities and departments
Design Principle: Patient data is never transmitted unencrypted. Encryption keys remain within hospital control.
🧠 Core Concept
Data is encrypted inside hospital systems
Safile never sees raw patient data
Only encrypted records are stored externally
Keys are stored on-premise, not in the cloud
🏗 Architecture
Layer
Technology
Purpose
Frontend
React + Vite + Wouter
Admin dashboard
Backend
Express (Node.js)
API & business logic
Database
PostgreSQL + Drizzle ORM
Metadata & logs
API Spec
OpenAPI 3.1
Contract & code generation
Validation
Zod + drizzle-zod
Schema validation
Storage
Sia (indexd gateways)
Decentralized backups
🗄 Core Data Models
Table
Description
ehr_connectors
External EHR integrations
encryption_keys
Key lifecycle & rotation tracking
indexd_nodes
Sia storage gateways
backup_snapshots
Backup history
backup_records
Individual encrypted records
🔌 API Overview
EHR Connectors

GET    /api/ehr-connectors
POST   /api/ehr-connectors
GET    /api/ehr-connectors/:id
PATCH  /api/ehr-connectors/:id
DELETE /api/ehr-connectors/:id
POST   /api/ehr-connectors/:id/test
Backups

GET    /api/backups
POST   /api/backups
GET    /api/backups/:id
GET    /api/backups/:id/records
Encryption Keys

GET    /api/keys
POST   /api/keys
POST   /api/keys/:id/rotate
GET    /api/keys/:id/audit
Storage Nodes

GET    /api/indexd-nodes
POST   /api/indexd-nodes
DELETE /api/indexd-nodes/:id
GET    /api/indexd-nodes/:id/status
Dashboard Stats

GET    /api/stats/summary
GET    /api/stats/backup-trend
GET    /api/stats/ward-coverage
⚙️ Development Setup
Prerequisites
Node.js 24+
pnpm
PostgreSQL 14+
Docker (optional)
Installation
Bash
git clone https://github.com/yucky-dev/safile.git
cd safile
pnpm install
Environment Configuration
Create a .env.local file:
Environment
DATABASE_URL=postgresql://user:password@localhost:5432/safile_dev

API_PORT=3000
API_HOST=localhost

VITE_API_URL=http://localhost:3000

# Optional (Sia)
INDEXD_ENDPOINT=https://indexd.sia.tech
Initialize Database
Bash
pnpm --filter @workspace/db run push
Run Development Servers
Bash
# API server
pnpm --filter @workspace/api-server run dev

# Frontend
pnpm --filter @workspace/safile-dashboard run dev
Frontend: http://localhost:5173⁠�
API: http://localhost:3000⁠�
🛠 Useful Commands
Bash
# Type check all packages
pnpm run typecheck

# Build for production
pnpm run build

# Regenerate API hooks & schemas
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes
pnpm --filter @workspace/db run push

# Lint (if configured)
pnpm run lint
🔐 Security Model
Area
Approach
Encryption
AES-256-GCM (client-side)
Key Storage
On-premise (never sent to server)
Storage
Encrypted data only (Sia)
Integrity
SHA-256 verification
Compliance
HIPAA-aligned, GDPR-compatible
No patient PII is stored on Safile servers
Only hashes, metadata, and encrypted payloads are handled
🚀 Deployment
Docker
Bash
docker build -t safile:latest .

docker run -e DATABASE_URL=postgresql://... \
           -e API_PORT=3000 \
           -p 3000:3000 \
           safile:latest
✅ Production Checklist
[ ] Set NODE_ENV=production
[ ] Use secure database credentials + SSL
[ ] Restrict CORS to frontend domain
[ ] Rotate encryption keys regularly
[ ] Monitor storage node health
[ ] Backup PostgreSQL daily
[ ] Enable audit logging
[ ] Test disaster recovery
🧭 Roadmap
Multi-factor authentication (MFA)
Role-based access control (RBAC)
Real-time backup streaming
Web3 key escrow integration
Automated disaster recovery testing
Mobile monitoring app
🤝 Contributing
Contributions are welcome.
Bash
# Create a feature branch
git checkout -b feature/your-feature

# Commit changes
git commit -m "Add feature"

# Push and open PR
Follow TypeScript best practices
Run pnpm run typecheck before submitting
📄 License
Specify your license here (MIT, Apache 2.0, etc.)
👤 Maintainer
Abuo Favour Opiah
GitHub: https://github.com/yucky-dev⁠�
