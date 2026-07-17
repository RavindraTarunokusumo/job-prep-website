# Spec: JOB-14 — Human-made interview video library

| Field | Value |
|-------|--------|
| **Status** | Accepted (Autopilot grant — Wave 2) |
| **Date** | 2026-07-17 |
| **Branch** | `feat/job-14-videos` |
| **Worktree** | `.worktree/wave2-job-14-videos` |
| **Linear parent** | [JOB-14](https://linear.app/job-prep-website/issue/JOB-14/set-up-human-made-interview-video-library) |
| **Children** | JOB-63…66 |
| **Depends on** | Phase 2 auth/onboarding; Phase 4 prep plan (for recommendations) |
| **Implementer model** | `grok-4.5` (high effort) |
| **Note** | **Curated human-made content only** — no AI-generated video claims or generation pipeline |

## 1. Goal

Authenticated, onboarded users can browse a curated library of **human-made** interview preparation videos (public YouTube/Vimeo URLs as placeholders), filter by category/role/industry/experience, and optionally add entries via a simple admin form. Prep plan items can deep-link or category-match into the library when relevant.

## 2. Scope

### JOB-63 — Data model

Prisma model `InterviewVideo` (global content, not user-owned):

| Field | Type | Notes |
|-------|------|--------|
| `id` | cuid | PK |
| `title` | string | Required |
| `url` | string | Public watch URL (YouTube/Vimeo ok as placeholders) |
| `categoryTags` | `String[]` | e.g. `behavioral`, `technical`, `case`, `motivation` |
| `targetRoles` | `String[]` | Optional free-text role filters (empty = all roles) |
| `targetIndustries` | `String[]` | Optional industry filters |
| `experienceLevels` | `String[]` | Optional levels aligned with onboarding when set |
| `summary` | text? | Short description for cards |
| `transcript` | text? | Optional transcript or key talking points |
| `published` | boolean | Default `true`; unpublished hidden from browse |
| `sortOrder` | int | Default `0` |
| `createdAt` / `updatedAt` | DateTime | Standard |

Migration + zod validation in `web/lib/validation/video.ts`. Index on `published`.

**Content policy:** Seed and UI copy state that library entries are **human-made / externally hosted** placeholders for MVP — **not** AI-generated videos. Do not add any video generation feature.

### JOB-64 — Browse / filter UI (`/videos`)

Replace placeholder page with:

- List of published videos (title, summary, tags, external open link)
- Client or server filters: category tag, role, industry, experience level (query params preferred for shareable links)
- Empty state when no matches
- Human-made content disclaimer visible on the page

### JOB-65 — Simple admin path

- Route: `/videos/admin` (or equivalent settings-gated section)
- Form: title, url, category tags (comma-separated), optional role/industry/experience, summary, transcript, published checkbox
- **MVP authz:** any **authenticated + onboarded** user may create entries (global content; no ownership). Document clearly — not a multi-tenant CMS; tighten roles later if needed.
- No edit/delete CMS in MVP (optional soft hide via `published=false` only if cheap; otherwise create-only)

### JOB-66 — Prep plan recommendations

When possible:

1. **href:** AI / plan items may use `/videos` or `/videos?category=<tag>` deep links (extend prep-plan prompt hints).
2. **Category match:** interview-category plan items without a useful href can surface a “Watch related videos” link to `/videos` (optionally filtered by keyword from title).
3. Helper: pure function matching plan item category/title keywords → recommended filter query or video ids from published set (used by plan UI and/or videos page “from your plan” banner).

### Seed

Idempotent seed of a few sample rows with public YouTube/Vimeo URLs as **placeholder** metadata. Script: `npm run seed:videos`. Auto-seed-if-empty pattern on first browse (same as assessments) is acceptable.

### Tests & docs

- Simple zod/schema + seed integrity tests (URL present, published flags, tags non-empty where expected)
- `docs/database.md` model row
- `TODO.md` active JOB-14 section
- Full `web/` suite: lint, typecheck, test, build

### Out of scope

- AI video generation or “AI avatar” content claims
- Complex CMS (bulk import, multi-role admin, moderation queue)
- Embedding players that require API keys (external link is enough)
- User-private video collections / ownership
- JOB-15 report, JOB-17 metrics

## 3. Interfaces

```ts
// lib/validation/video.ts
export const videoCategoryTagSchema = z.enum([
  "behavioral", "technical", "case", "motivation",
  "company_research", "salary_negotiation", "general",
]);
export const interviewVideoCreateSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  categoryTags: z.array(z.string().min(1)).min(1),
  targetRoles: z.array(z.string()).default([]),
  targetIndustries: z.array(z.string()).default([]),
  experienceLevels: z.array(z.string()).default([]),
  summary: z.string().max(2000).optional().nullable(),
  transcript: z.string().max(50000).optional().nullable(),
  published: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// app/actions/video.ts
export async function listVideosAction(filters?: VideoFilters): Promise<{ videos: VideoListItem[]; seeded: boolean }>;
export async function createVideoAction(input: unknown): Promise<Result & { id?: string }>;

// lib/videos/recommend.ts
export function videoHrefForPlanItem(item: { category: string; title: string; href?: string | null }): string | null;
export function matchVideosForPlanItem<T extends { categoryTags: string[]; title: string }>(
  item: { category: string; title: string },
  videos: T[],
  limit?: number
): T[];
```

## 4. Success criteria

- [x] Published videos appear on `/videos` with working filters
- [x] Authenticated onboarded user can add a video via `/videos/admin`
- [x] Seed loads sample human-made placeholder rows
- [x] Plan items can link/recommend videos (href or category match)
- [x] Simple tests + database.md + TODO updated
- [x] Full `web/` lint, typecheck, test, build pass
- [x] No AI video generation code or claims

## 5. Constraints

- Global content; admin writes = authenticated onboarded (MVP) — document in UI and docs
- Single trailing newline on files; implementer does **no git**
- Do not claim videos are AI-generated; disclaimer: curated human-made / external hosts
- Prefer patterns from JOB-13 assessments (seed-if-empty, server actions, Card UI)
