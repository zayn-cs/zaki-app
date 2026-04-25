# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
This project is a French-language infrastructure project archiving system ("Système d'Archivage").

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL (native, managed by Replit; schema initialized on startup)
- **Auth**: express-session + bcryptjs (internal session auth; no Clerk/Replit Auth)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- **Build**: esbuild (ESM bundle via `build.mjs`)
- **File uploads**: Multer, stored in `artifacts/api-server/uploads/`

## Artifacts

### API Server (`artifacts/api-server`)
- Serves at `/api` (Replit proxy: port 8080 → /api path)
- Auto-creates PostgreSQL schema on startup (`src/lib/db.ts`)
- Seeds default admin user: `admin` / `admin123` (only if no users exist)
- Routes in `src/routes/`: auth, projets, lots, phases, documents, utilisateurs, departements, recherche, historique, misc
- File upload: `POST /api/documents/:id/upload` (Multer, 50MB limit)
- Session: express-session with `SESSION_SECRET` env var

### Frontend (`artifacts/archivage-app`)
- React + Vite + TypeScript
- Serves at `/` (Replit proxy: port 26198 → / path)
- Uses `wouter` for routing
- Auth context: `src/lib/auth-context.tsx` (manages session)
- API calls go to `/api/...` (proxied by Replit)
- Pages: Dashboard, Projets, Lots, Documents, Recherche, Historique, Utilisateurs, Départements

## Business Hierarchy

Projet → Lot → Phase → Document → Version
Projet → Block → Zone
Block ↔ Lot (many-to-many via block_lot)
Phase → TypePhase
Region → CMD → Unite → Projet
Tag ↔ Document (many-to-many via document_tag)

## User Roles
- `admin` — full access
- `coordinateur` — full access
- `chef_departement` — department-level access
- `chef_projet` — project management
- `responsable_lot` — lot management

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Default Login
- **Identifiant**: `admin`
- **Mot de passe**: `admin123`
- **Role**: Admin (all access)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
