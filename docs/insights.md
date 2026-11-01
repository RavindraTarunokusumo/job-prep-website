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

## 2026-07-17 — Phase 5 Autopilot cycle (session close)

### Tools & commands

- **Model id drift:** AGENTS.md pin `grok-composer-2.5-fast` failed with `unknown model id`. `HOME=/root grok models` listed only **`grok-4.5`**. Handoffs used `-m grok-4.5 --effort high --yolo --output-format json` successfully.
- Long handoffs still need background + wait; capture `sessionId` and `find ~/.grok/sessions -type d -name $sessionId -prune -exec rm -rf {} +`.
- Worktree: `git worktree add .worktree/job-9-cover-letter -b feat/... main`; symlink `web/.env.local`; `npm ci` + `npx prisma generate` in worktree.
- GitNexus CLI not registered for this repo (only unrelated indexes). Fall back to direct reads; note blocker, do not block Autopilot.
- Linear: full project name filter; mark parent + children Done after merge; PR attachment auto-linked.
- PR path: `gh pr create` (no `--json` on create); `gh pr merge N --merge` preserves SHAs/notes; push `refs/notes/commits` separately.
- Dirty main tree (local AGENTS/CLAUDE edits) blocked clean checkout — `git stash` before ff-only pull for Post-PR.

### Skills / review

- Bundled `/bundled:review` on PR #5 posted **PENDING** review with real UI bugs: section regen same-id left client state stale; save recomposed from sections and wiped free-edited full letter.
- Reception: verified against code, fixed before relying on merge (landed as `31a99dd`). PENDING review still needs human Submit on GitHub.

### Recurring failure modes

- Documented model pin becomes stale when CLI model catalog changes — orchestrator must run `grok models` and fall back without aborting Autopilot.
- Client editors that remount only on id change will not reflect in-place server updates unless actions return payloads and client applies them (or force remount keys).
- Prisma JSON clear needs `Prisma.JsonNull`, not raw `null`, under strict client types.

### Worth improving (harness proposals)

1. **Model pin rule:** “Prefer AGENTS model pin; if CLI rejects, run `grok models` and use listed default; record actual model in insights.”
2. **Editor action contract:** Server actions that mutate same-row content should return `{ content, sections? }` for client state sync when UI is useState-initialized from props.
3. **GitNexus optional:** if repo not in index, one-line log and continue (already practice; make explicit so juniors do not thrash on impact commands).

### Applied this session

- PR #5 merged (`3c929e1`); archive Phase 5; Linear JOB-9 + JOB-42…45 Done.
- Reflection written; harness proposals above for user approval before AGENTS/CLAUDE edit.



## 2026-07-27 — JOB-85…92 Autopilot closeout (workflow/harness only)

### Tools & commands

- Linear product backlog lived in **Todo**, not the named **Backlog** status; enumeration must query both unstarted states.
- `gh pr create` may lack `--json`; capture URL from text output and re-query with `gh pr view --json`.
- Merge with `gh pr merge N --merge` preserves per-commit SHAs and git notes; always push `refs/notes/commits` separately.
- Local root `main` can be ahead with unpushed docs-only commits + untracked `.grok` — Post-PR/Reflection **must** use a fresh worktree from `origin/main` only; never stage root main dirt.
- Grok model pin `grok-composer-2.5-fast` unavailable; `HOME=/root grok models` listed only `grok-4.5`. Review handoffs used `-m grok-4.5`.
- Long review handoffs need extended wait; capture `sessionId` and delete `~/.grok/sessions/**/<sessionId>` after processing.
- PENDING GitHub reviews on intermediate tips go stale when tip moves — re-run tip review before merge; process merge-blocking bugs before `gh pr merge`.

### Skills / review

- Bundled `/bundled:review` correctly flagged fair-use double-counting (multi-step AI under one product action), readiness including rejected mappings, webhook scan/race, and FK IDOR on optional match rewrites.
- Reception protocol: verify against code, fix merge-blockers, re-run full suite, push, then merge — do not merge on PENDING alone.

### Recurring failure modes

- Fair-use meters must count **product actions** (analyses, sessions), not raw LLM sub-calls.
- Domain helpers without server-action wiring fail adversarial “dead code” checks even when unit tests pass.
- Soft-archive + unique constraints: prefer non-unique DB indexes + app dedupe, or unique only when soft-delete renames keys.

### Worth improving (harness proposals)

1. Document: “Linear Backlog enumeration = status Backlog **and** Todo (unstarted).”
2. Document: “Before merge, re-review current head if prior PENDING review predates tip commits.”
3. Document: “Post-PR/Reflection always `git worktree add … origin/main`; never use dirty local main.”
4. Model pin fallback already proposed previously — reaffirm after catalog-only `grok-4.5` environment.

### Applied this session

- PR #14 merge commit `65fa7e2`; Post-PR archive `3450a3b` on main; Linear JOB-85…92 Done after merge verification.
- Reflection commit follows on main (this section).

## 2026-11-01 — Session closeout (workflow/harness only)

### Tools & commands

- **Node version resolution in non-interactive shells:** System `/usr/bin/node` is `v18.19.1`, whereas Next 16 / Vitest 4 require Node 20+. Non-interactive subshells must prepend `$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node | tail -n 1)/bin` to `PATH`.
- **Git notes remote sync (`refs/notes/commits`):** Pushing `refs/notes/commits` from a new worktree fails with `fetch first` when remote notes exist from earlier sessions. Always run `git fetch origin refs/notes/commits:refs/notes/origin-commits && git notes merge -s cat_sort_uniq refs/notes/origin-commits` before `git push origin refs/notes/commits`.
- **Subagent reuse (`invoke_subagent` + `send_message`):** Reusing the same implementer subagent across sequential tasks (`CV.2` → `CV.3` → `CV.4`) via `send_message` preserved worktree context and eliminated cold-start file re-reads, while the orchestrator independently ran the full `web/` suite and committed each task.
- **GitHub Rulesets API (`gh api repos/.../rulesets`):** Configured active `main` branch protection requiring the `Web CI` check and blocking force-pushes/deletions, while setting `RepositoryRole` (`actor_id: 5`, Repository Admin) to `bypass_mode: "always"` so Post-PR/Reflection fast-forward commits to `main` continue to work without turning rulesets off.

### Skills / review

- Dedicated read-only `research` code-reviewer subagent caught a real `/g` regex `lastIndex` statefulness bug on `.test()` and stale `.env.example` comments prior to PR creation.

### Recurring failure modes

- Calling `.test()` on a global (`/g` or `/gi`) `RegExp` constant mutates `lastIndex` across calls and causes alternating false negatives. Keep `.test()` regexes non-global.
- `git push origin refs/notes/commits` without fetching/merging `refs/notes/commits` first is rejected whenever remote notes were updated in prior PRs.

### Worth improving (harness proposals)

1. **Git notes fetch-merge rule in `AGENTS.md` / `CLAUDE.md`:** Update the Git notes section to include `git fetch origin refs/notes/commits:refs/notes/origin-commits && git notes merge -s cat_sort_uniq refs/notes/origin-commits` before `git push origin refs/notes/commits`.
2. **NVM PATH note in `AGENTS.md` / `CLAUDE.md`:** Document that non-interactive shells on this host default to `/usr/bin/node` (v18) and should export the NVM Node 22 bin path before running `npm` commands in `web/`.
3. **CI status check alignment:** Document that `Web CI` (`.github/workflows/ci.yml`) is now a required status check on `main` via GitHub Ruleset `main-branch-protection`.

### Applied this session

- PR #19 merged (`52dd84d`); PR #20 merged (`abdfa91`); Post-PR archive `efa5c04` on `main`.
- Global communication rules configured under `~/.gemini/config/`.
- Reflection committed to `main`; awaiting user confirmation to remove `.worktree/` directories and local feature branches.
