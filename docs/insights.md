# Insights

Workflow lessons only — no feature implementation details.

## 2026-07-15 — Phase 0–1 Autopilot cycle

### Tools & commands

- Linear MCP (`list_teams`, `list_projects` / `get_project`, `list_issues`, `save_issue`) works for team **Job Prep Website** and project **MVP Roadmap**. Prefer full project name when filtering issues (`MVP` alone failed).
- Junior handoffs: `HOME=/root grok -p "..." -m grok-composer-2.5-fast --effort high|xhigh --yolo --output-format json`. Capture `sessionId`; always delete `~/.grok/sessions/**/<sessionId>`.
- Long handoffs exceed default shell timeout; background and wait rather than killing.
- Git notes: use `.github/git_notes_template.md` (`Task` / `Summary` / `Docs` / `TODO` / `Validation`). Overwrite with `git notes add -f`. Publish with `git push origin refs/notes/commits` (normal branch push does not include notes).
- Pre-commit for monorepo `web/`: local hooks that `cd web` for eslint/tsc/prisma; root mirrors-eslint does not load `web/eslint.config.mjs`.

### Skills / review

- Composer 2.5 PR review caught a real blocking pre-commit ESLint gap before merge.
- `gh pr merge --merge` preserves commit SHAs so existing notes remain valid.

### Recurring failure modes

- Freehand git notes without the template diverge from harness expectations — always open `.github/git_notes_template.md` before `git notes add`.
- `web/.gitignore` default `.env*` also ignores `.env.example` unless `!.env.example` is added.
- create-next-app / Prisma 7 vs 6: pin Prisma 6 if the schema uses `url = env("DATABASE_URL")` in `schema.prisma`.

### Worth improving

- Document `git push origin refs/notes/commits` in agent harness after first notes commit of a branch.
- Add a shared Prettier config under `web/` so pre-commit prettier can re-enable on frontend files.
- Optional: small script to attach notes from the template fields interactively.

### Applied to harness (2026-07-15)

Workflow lessons above were folded into `AGENTS.md` / `CLAUDE.md`:
- Git notes procedure + `refs/notes/commits` push (Workflow Rule 11)
- Prefer merge commits over squash when notes exist (Rule 12)
- Composer 2.5 handoff defaults, long-running handoff wait, `web/` full suite
- Linear full project-name filter
- Monorepo pre-commit / `.env.example` / Prisma schema notes
- Reflection must propose harness updates; apply when user requests

## 2026-07-15 — Phase 2 Autopilot cycle

### Tools & commands

- Supabase env validation without printing secrets: JWT `role` claim check + Auth health + REST probe + `pg` connect.
- Root `.gitignore` for `.env*` is required; Next.js also needs `web/.env.local` (separate from repo root).
- `cookies().set` is illegal in Server Components — only Server Actions / Route Handlers (caught on onboarding page load).
- Prisma Edge limitation: middleware cannot query DB; onboarding gate used an httpOnly cookie synced from actions.

### Recurring failure modes

- Service role key may be non-JWT "secret" format; do not assume JWT shape in code.
- Freehand notes without `.github/git_notes_template.md` still a risk — template push of `refs/notes/commits` remains mandatory.

### Applied to harness

- No AGENTS.md change this cycle beyond existing cookie/notes rules; log cookie restriction more explicitly if it recurs.

## 2026-07-15 — Phase 3 Autopilot cycle (session close)

### Tools & commands

- Resume pipeline: upload → Supabase Storage → PDF/DOCX text extract → structure (heuristic default) → review UI.
- **GLiNER2** (https://github.com/fastino-ai/GLiNER2): install via venv with **CPU torch** only (`pip install torch --index-url …/cpu` then `gliner2`). Full `gliner2[local]` pulled CUDA wheels and **filled the disk**.
- Sidecar pattern: Python script + Node `spawn` behind `RESUME_STRUCTURE_PARSER=gliner`; fall back to heuristics on failure.
- Prisma dev footgun: `globalThis` PrismaClient stale after schema add → missing `resumeDocument`; fix with versioned client recreate + restart `npm run dev`.
- SSH tunnel for preview: `next dev --hostname 127.0.0.1 --port 3000` + local `ssh -L 3000:127.0.0.1:3000 …`.

### Product / architecture lessons (workflow-facing)

- Document storage/parser ADRs in `docs/architecture.md` when diverging from Linear wording (Blob → Storage; heuristics → optional GLiNER).
- Industry resume parse is multi-stage; MVP should not over-promise heuristic form fill. User edit remains required.
- Disk/space is a real constraint for local ML experiments on small VMs.

### Skills worth improving

- Optional skill/script: “bootstrap ML sidecar venv (CPU-only)” checklist.
- Consider documenting `PIONEER_API_KEY` / GLiNER cloud path when local torch is too heavy.

### Applied this session

- Post-PR #3 archive + Linear JOB-6 Done.
- Session concluded pending user OK to delete feature branch `feat/phase-3-cv-upload-parse`.

## 2026-07-16 — Phase 4 Autopilot cycle (session close)

### Tools & commands

- OpenRouter via Vercel AI SDK (`ai` + `@ai-sdk/openai`); env must live in **`web/.env.local`** (root `.env.local` alone is not loaded by Next).
- Long Composer handoffs: background shell wait; capture `sessionId` from `--output-format json`; always `find ~/.grok/sessions -type d -name $sessionId -prune -exec rm -rf {} +`.
- PR merge: `gh pr merge N --merge` preserves per-commit SHAs/notes; push `refs/notes/commits` separately.
- Manual preview: `npm run dev -- --hostname 127.0.0.1 --port 3000` + local `ssh -L 3000:127.0.0.1:3000 user@host`.
- Base UI `Button` + `render={<Link />}` requires `nativeButton={false}` **or** prefer `Link` + `buttonVariants` (dashboard fix).

### Recurring failure modes

- **Config sprawl:** changing model defaults by rewriting every AI service/action is wrong. Single file `web/lib/ai/config.ts` + thin openrouter helper only.
- Bundled review posts **PENDING** GitHub reviews; human must submit on GitHub. Threads do not auto-resolve when fixes land later.
- Free OpenRouter models: rate limits / flakiness → primary + fallback in config is worthwhile; do not hardcode models in feature modules.
- Prisma migrate from implementer subagent may fail without env; orchestrator should `source web/.env.local` and `prisma migrate deploy`.

### Skills / review

- Composer 2.5 bundled review caught real issues (server-action IDOR-shaped export, score Int vs float, plan status validation). Reception protocol: verify then fix, not performative agreement.
- Do not treat GitHub Copilot quota failures as a review substitute.

### Worth improving (harness proposals)

1. **AI config rule** in AGENTS/CLAUDE: “All LLM model ids and fallbacks live only in `web/lib/ai/config.ts` (or documented env). Never scatter model strings across services.”
2. **Post-review note:** after `/bundled:review`, record whether findings were addressed on branch before merge; optional re-review only if user asks.
3. **Base UI link buttons:** document pattern `Link` + `buttonVariants` vs `nativeButton={false}` under monorepo UI conventions.
4. **Env bootstrap:** when user adds keys at repo root, always sync to `web/.env.local` and mention in handoff prompts.

### Applied this session

- PR #4 merged (`3f324f5`); Post-PR archive Phase 4; Linear JOB-7/8/10 already Done.
- Reflection written; harness proposals listed above for user approval before AGENTS/CLAUDE edit.


