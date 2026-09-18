# AGENTS.md 

**Project: Job Preparation Website**

**Follow the [Workflow](#workflow) strictly for feature implementation**. Do not start implementation until Steps 1-3 are complete. Before editing, show which step you are on.

Any change made to `CLAUDE.md` should also be applied to `AGENTS.md`.

## Project Map

- Architecture: [docs/architecture.md](docs/architecture.md)
- Database / Persistence: [docs/database.md](docs/database.md)
- Patterns: [docs/patterns.md](docs/patterns.md)
- Testing: [docs/testing.md](docs/testing.md)
- Commands: [docs/commands.md](docs/commands.md)
- Agent Harness: [docs/agent-harness.md](docs/agent-harness.md)
- Full Index: [docs/index.md](docs/index.md)
- Core Spec: [SPEC.md](SPEC.md)

## Code Graph / Repo Map

If a code graph, dependency map, or architecture index exists, use it before touching unfamiliar code.

Rules:
- Do not rebuild the graph while files are being modified.
- Only rebuild on a clean working tree.
- Use the graph as a snapshot, not a live source of truth.
- Query the graph first, then read files directly.

## Workflow

1. (Preamble) Ensure you're in a dedicated local branch/worktree under `.worktree/<session-name>` and activate the project environment (see [docs/commands.md](docs/commands.md)). Read the `docs/insights.md` file and the [Workflow Rules](#workflow-rules).
2. (GitNexus) Read the [GitNexus](#gitnexus--code-intelligence) section at the start of every session.
3. (Spec Writing + Lightweight Plan) For feature implementation, write a detailed specification document following a spec-driven development process (requirements, data models, interfaces, workflows, edge cases, success criteria, and constraints). Do not write implementation plans or code until the spec is complete and accepted. Read the docs (see [Project Map](#project-map)) and use GitNexus as your primary means to understand the codebase. For debugging or minor patching, skip this step. Once the spec is accepted, produce a **lightweight implementation plan** that serves as the implementer subagent's contract — file structure, task decomposition, per-task **Interfaces** (Consumes/Produces signatures), build order, and risks. Do **not** inline verbatim per-step code or exact shell commands; the implementer regenerates those from the contract. The plan's value is the cross-task contract (who calls what, in what order), not transcribed code — that contract is what catches the class of bug a narrowly-scoped implementer cannot see (e.g. a changed signature breaking another caller). This preserves the spec→plan→implementation independent-verification chain at a fraction of the planning cost.
4. (Implementing) Log tasks and sub-items in `TODO.md` first, then implement each task by delegating to a subagent as the implementer. Review and validate the produced changes, run the **full** frontend suite from `web/` before each commit (`npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` when the change affects the app), attach a git note using [`.github/git_notes_template.md`](.github/git_notes_template.md) (see [Git notes](#git-notes)). Commit any files the subagent wrote immediately (per Workflow Rule 8). Cross each sub-item and item once done. Where the task graph allows — independent tasks with disjoint files and no shared dependency on unlanded work — run multiple implementer subagents in parallel using isolated git worktrees; otherwise implement sequentially. After each delegated task, the main agent independently validates with the **full** suite plus typecheck and lint before committing — never trust the implementer's scoped self-report. Also review the diff and normalize implementer output (e.g. trailing newlines) during review.
5. (Submit PR) Finally, follow the instructions in the [Submit PR](#submit-pr) workflow and notify the user once every step has been completed.
6. (Post-PR) Update documentation files once the PR has been merged and archive completed TODO items from `TODO.md` into `docs/iterations/archive/`; ensure each sub-item in the TODO is tagged with the commit hash and each session is tagged with the merge ID — `TODO.md` should only contain **active or future** work. These Post-PR doc/archive commits are pushed **directly to `main`** (no PR — the feature PR is already merged); fast-forward only, never force. Attach git notes per the [template](.github/git_notes_template.md) and push `refs/notes/commits`.
7. (Reflection) Conclude the session by doing the [Reflection](#reflection) exercise; the Reflection commit is likewise pushed **directly to `main`** (no PR). After receiving confirmation from the user, delete the worktree and branch.

### Workflow Rules

1. Every TODO sub-item should land as its own commit.
2. Any extension or modification to the task should be logged in the TODO (and the accepted spec when scope changes).
3. Use specific staging, never `git add -A`.
4. Never force-push, reset `--hard`, merge or amend unless explicitly asked.
5. Keep comments sparse, naming clear, abstractions minimal, and avoid compatibility shims.
6. When lint/typecheck/test fails only on files you did not touch, note it as pre-existing and proceed — do not attempt workarounds that affect other files.
7. After context compaction resumes, run `git status` before any other action — the summary describes intent, not exact commit state.
8. Commit any files written by subagents immediately; do not advance the workflow with a dirty tree.
9. After a delegated implementation task, validate with the **full** suite + typecheck + lint (not the implementer's scoped tests) before committing. A per-task implementer self-scopes its own verification and structurally cannot see cross-task breakage (e.g. a changed signature breaking another caller); only the full project-level run catches it. For this repo, run from `web/`: `npm run lint && npm run typecheck && npm test` (and `npm run build` when routes/UI/config change).
10. Every commit gets a git note filled from [`.github/git_notes_template.md`](.github/git_notes_template.md) — never freehand a different schema. After the first notes commit on a branch (and after any notes rewrite), push notes: `git push origin refs/notes/commits`. A normal branch push does **not** include notes.
11. Prefer **merge commits** (not squash) when landing feature PRs that already carry per-commit notes, so commit SHAs (and their notes) remain valid on `main`.


### Git notes

Use **only** the fields in [`.github/git_notes_template.md`](.github/git_notes_template.md):

```
Task: <short task title>
Summary: <brief change summary and reason>
Docs: <comma-separated docs paths, or N/A>
TODO: <TODO.md section/item reference>
Validation: <checks run, e.g., ruff, eslint, pytest, manual>
```

**Procedure after every commit:**
1. Open the template (do not invent a different schema).
2. Attach the note: `printf '%s\n' "$note" | git notes add -F - HEAD` (use `git notes add -f` only when intentionally rewriting a note).
3. Verify: `git notes show HEAD`.
4. Publish notes when pushing the branch or after rewriting notes on already-pushed commits:
   ```bash
   git push origin HEAD
   git push origin refs/notes/commits
   ```

Notes are **not** included in a normal branch push. Without step 4, notes exist only locally.

### Linear (project tracking)

When using the Linear MCP for this team:

- Team: **Job Prep Website** (`JOB`).
- Project filter: use the **full** project name (e.g. `MVP Roadmap — Personalized Job Preparation Plan`). Short queries like `MVP` alone may fail to resolve.
- Prefer `get_project` + `list_issues` with `team` + full `project` name over complex `list_projects` queries that can hit complexity limits.

### Monorepo / `web/` conventions

- Application code lives under `web/`. Run lint, typecheck, test, and build from `web/`.
- Root pre-commit hooks for ESLint, TypeScript, and Prisma **must** execute in the `web/` context (e.g. `cd web && npx eslint --fix .`). A root `mirrors-eslint` hook will not load `web/eslint.config.mjs`.
- If committing env templates, ensure `web/.gitignore` has `!.env.example` under any `.env*` ignore rule so `.env.example` is tracked.
- Prefer Prisma major versions that match the schema style in-repo (currently Prisma 6-style `url = env("DATABASE_URL")` in `schema.prisma`). Do not silently upgrade to a major that removes that form without a coordinated config change.

### Submit PR

1. Fill out the **[Template](.github/pull_request_template.md)** and submit the PR (capture the PR number/URL, e.g. via `gh pr create --json number,url`). Confirm the PR template checkbox for git notes is satisfied.

2. (Optional) If the changes affect security (or explicitly stated), delegate a non-interactive security review to a reviewer subagent using a `/security-review` or equivalent skill. Always cite justification. Capture the session ID and clean it up afterwards so the review chat session is deleted.

3. Use a code-review skill available in your skillset and delegate a subagent to handle the review. Then, use the `/receiving-code-review` skill if available to review and resolve them before pushing them to the branch. 

4. When merging (only if the user asks, or Autopilot/post-approval requires it), prefer a **merge commit** over squash so per-commit git notes remain addressable by SHA. After merge, push any remaining notes if rewrites happened: `git push origin refs/notes/commits`.

- Rigorously address the review findings before considering the task complete. Use the reception protocol defined in [.codex/skills/receiving-code-review/SKILL.md](.codex/skills/receiving-code-review/SKILL.md) (or the equivalent receiving-code-review skill when available):
  - Read the full feedback first.
  - Verify each item technically against the actual codebase.
  - Push back (with clear technical reasoning) on items that seem incorrect, unclear, or low-value.
  - Implement one change at a time and test it.
  - Avoid performative agreement ("You're right!", "Great catch!"); just state what was done or ask for clarification.

### Reflection

After every session completion, reflect on the **workflow and agent harness** — commands executed (and which failed consistently), tools used, skills invoked, MCP access, scripts created, recurring failure modes, and skills worth adding/improving. **Do not include anything feature-specific**. Write this down in [Insights](docs/insights.md), report the reflection to the user in chat, and **propose concrete harness updates** (to `AGENTS.md` / `CLAUDE.md`, templates, hooks) derived from those lessons. Apply harness updates when the user asks (or when they already asked you to update the workflow from the reflection). Reflection and harness-update commits are pushed **directly to `main`** (fast-forward only).

### GitNexus — Code Intelligence

This repo is indexed by **GitNexus** when available. Use the GitNexus MCP tools to understand code, assess impact, and navigate safely. (If MCP tools aren't registered in the current session, fall back to the CLI: `npx gitnexus <command> --repo .`.)

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` (or `npx gitnexus impact --repo . symbolName`) and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/<name>/context` | Codebase overview, check index freshness |
| `gitnexus://repo/<name>/clusters` | All functional areas |
| `gitnexus://repo/<name>/processes` | All execution flows |
| `gitnexus://repo/<name>/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

**Additional rules:**
- Do not rebuild the graph while files are being modified.
- Only rebuild on a clean working tree.
- Use the graph as a snapshot, not a live source of truth.
- Query the graph first, then read files directly.
- If the MCP registry does not expose this repo, record the blocker and fall back to direct file reads.
- If the graph index predates the current branch's base commit, skip impact analysis and read callers directly — say so explicitly.
