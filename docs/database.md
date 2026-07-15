# Database and file persistence

## PostgreSQL (Prisma)

Schema: `web/prisma/schema.prisma`  
Migrations: `web/prisma/migrations/`

### Models (MVP to date)

| Model | Purpose |
|-------|---------|
| `User` | Mirrors Supabase `auth.users` id + email |
| `Profile` | Career onboarding fields |
| `ResumeDocument` | CV upload metadata, status, raw text, parsed JSON, storage key |

### Prisma client in Next.js dev

`web/lib/prisma.ts` caches a `PrismaClient` on `globalThis` in development. After schema changes, run:

```bash
cd web && npx prisma generate
```

and restart `npm run dev` if delegates are missing. The singleton also tracks a **schema version string** so stale clients without new models (e.g. `resumeDocument`) are discarded.

## Supabase Storage

See [ADR-001 in architecture.md](./architecture.md#adr-001-resume-file-storage--supabase-storage-not-vercel-blob).

| Item | Value |
|------|--------|
| Bucket | `resumes` (private) |
| Path | `{userId}/{documentId}/{safeFilename}` |
| Provider field | `ResumeDocument.storageProvider` (`supabase` default) |

Bucket may be auto-created via the service-role admin API on first upload (`ensureResumesBucket`).

## Environment

Never commit secrets. Use gitignored `.env.local` at repo root and/or `web/.env.local`.

| Variable | Use |
|----------|-----|
| `DATABASE_URL` | Prisma |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server user session |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin (storage bucket ensure/upload helpers) |
| `BLOB_READ_WRITE_TOKEN` | Optional future Vercel Blob adapter (not required for MVP storage) |
