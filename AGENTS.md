# AGENTS.md / CLAUDE.md (Canonical General Template)

**Project-independent canonical workflow**. Adapt only the project name, description, project map links, and any project-specific invariants or GitNexus details when copying to a new repo. Never change the central 7-Step Workflow ordering or core structure without explicit user direction.

**Follow the [Workflow](#workflow) strictly for feature implementation**. Do not start implementation until Steps 1-3 are complete. Before editing, state which step you are on. Before finishing, confirm Step 6 and Step 7.

Any change made to `AGENTS.md` must also be applied to `CLAUDE.md`.

## Project Map

- Core Spec / Product Spec: [SPEC.md](SPEC.md)
- Architecture: [docs/architecture.md](docs/architecture.md)
- Database / Persistence: [docs/database.md](docs/database.md)
- Patterns: [docs/patterns.md](docs/patterns.md)
- Testing: [docs/testing.md](docs/testing.md)
- Commands: [docs/commands.md](docs/commands.md)
- Agent Harness: [docs/agent-harness.md](docs/agent-harness.md)
- Spec Workflow: [docs/specs/README.md](docs/specs/README.md)
- Insights: [docs/insights.md](docs/insights.md)
- Full Index: [docs/index.md](docs/index.md)
- Changelog: [docs/changelog.md](docs/changelog.md) (optional)

## Code Graph / Repo Map

This repo is indexed by **GitNexus** when available. See the GitNexus section below for all rules and resources.

Rules:
- Do not rebuild the graph while files are being modified.
- Only rebuild on a clean working tree.
- Use the graph as a snapshot, not a live source of truth.
- Query the graph first, then read files directly.
- If GitNexus/MCP cannot resolve the repo, record the blocker and fall back to direct file reads.

## Workflow

1. **Preamble** — Work in a dedicated local branch or worktree. Activate the project environment. Confirm repo status before editing. Read `docs/insights.md` and the Workflow Rules. Identify the active accepted spec path under `docs/specs/`.

2. **Repo Map / GitNexus** — Read the GitNexus section at the start of every session. Run or query the available code graph/index if present. Use docs and graph output to understand the areas named by the active spec.

3. **Planning** — Read `AGENTS.md`, `docs/index.md`, the active spec, and relevant technical docs. If no accepted spec exists, create or refine one before implementation planning. Produce a concise plan and scope derived from the accepted spec. Do not edit implementation files until the plan is accepted unless the user explicitly granted Autopilot Mode.

4. **Implementation** — Log spec-derived tasks and sub-items in `TODO.md` before editing (include the active spec path). Implement each task by delegating to a Grok junior subagent as the implementer via the non-interactive CLI (one ephemeral session per task where practical — see Grok handoff section). After each handoff, the senior developer independently reviews the diff, normalizes output, validates with full lint/typecheck/tests before committing, then deletes the ephemeral Grok session directory.

5. **Submit PR** — Use the PR template. Fill out all fields (summary, spec path, scope, test plan, risk, rollback, docs, backlog, checks). Delegate PR code review (and security review where applicable) to Grok. Capture `sessionId`, process findings, clean up the session, and address findings. Run review agents **before** opening the PR; fix blocking findings first.

6. **Post-PR** — Once the PR has been merged, ensure `TODO.md` contains only active or future work. Archive completed TODO sessions into `docs/iterations/archive/` (including the related spec path). These commits are pushed **directly to `main`** (fast-forward only). Tag completed sub-items with commit hashes. Add session lessons to `docs/insights.md`.

7. **Reflection** — Conclude the session by recording useful workflow lessons in `docs/insights.md` (tools, skills, MCPs, scripts created, workflow improvements, recurring failure modes, skills worth adding/improving). Do not include feature-specific implementation details. Report the reflection to the user and wait for explicit permission before cleaning up worktrees/branches. This commit is pushed **directly to `main`**.

### Workflow Rules

1. Every TODO sub-item should land as its own commit.
2. Any extension or modification to the task must update the active spec first, then be logged in `TODO.md`.
3. Use specific staging; never use `git add -A`.
4. Never force-push, reset `--hard`, merge, or amend unless explicitly asked.
5. Keep comments sparse. Prefer clear naming over clever abstractions. Avoid compatibility shims unless explicitly required.
6. Do not leave important conclusions only in chat memory; write them to docs.
7. A chat prompt is not implementation authority by itself.
8. Do not implement from a spec with unresolved blocking open questions.
9. When pre-commit fails only on untouched files, note it as pre-existing.
10. After context compaction, run `git status` first.
11. Commit any files written by subagents immediately; do not advance the workflow with a dirty tree.

### Autopilot Mode

Autopilot Mode is an explicit grant from the user that authorizes the senior orchestrator to execute the full 7-step workflow end-to-end (Steps 3–7: planning through reflection) for a defined feature or cohesive set of changes without pausing for per-step user approval.

**Grant rules:**
- Must be explicitly stated by the user in the current session for the specific scope.
- Applies to exactly one independent workflow cycle.
- Does not carry over between sessions or to unrelated features.
- Does not waive the requirement for an accepted spec.

**Non-waived invariants (still mandatory under Autopilot):**
- Accepted spec under `docs/specs/`.
- TODO.md logging of every spec-derived task/sub-item **before** any edits.
- Every implementation sub-task delegated to an ephemeral Grok junior via the non-interactive handoff protocol.
- Independent senior review of every diff + full project validation (lint, typecheck, tests, GitNexus impact/detect_changes) before every commit.
- Specific staging only (`git add <specific files>`).
- Per-sub-item commits with git notes.
- Grok handoffs for all review gates (`/simplify`, security-review, bundled PR review).
- No force-push, hard-reset, amend, or merge.
- Post-PR archive of TODO items to `docs/iterations/archive/` with commit/merge tags and spec reference.
- Workflow-only reflection in `docs/insights.md` (tools, commands, recurring issues, skills — never feature details).
- Explicit user permission before deleting worktree/branch after reflection.

If discovery during implementation contradicts the spec or lightweight plan, immediately suspend Autopilot, document the issue, and report back.

Milestone progress updates are still sent concisely even under Autopilot.

### Grok Build Implementation/Review Handoff

The canonical contract for delegating any unit of work — implementation tasks (Step 4) or Submit PR gates/reviews (`/simplify`, security-review, PR code review) — to an ephemeral Grok subagent. All flows share this mechanism; only the prompt and post-processing differ. Grok is the default delegate for every subagent-shaped task in this repo; fall back to Claude's native `Agent` tool only when Grok is unavailable/blocked, and record the fallback reason in `TODO.md`.

**Invoke** (headless, single-turn, no TUI):

```bash
HOME=/root grok -p "<self-contained prompt>" -m grok-composer-2.5-fast --effort <LEVEL> --yolo --output-format json
```

- `-p`: headless single-turn mode; creates an ephemeral chat session.
- `-m`: model name; use `grok-composer-2.5-fast` for implementation and review tasks.
- `--effort`: `high` by default; `xhigh` for complex cross-module tasks or difficult reviews.
- `--yolo`: auto-approves tools so the delegation runs unattended; the senior dev remains responsible for reviewing all changes before commit.
- `--output-format json`: returns structured output including `text` (final summary) and `sessionId` (required for cleanup).

**Prompt** must be self-contained — the subagent starts cold with no session context: point it at the exact spec/plan section, name the precise file scope, and state the boundaries. For implementation, forbid all git operations (the main agent commits), require it to run the **full** `ruff check` + `ruff format --check` + `mypy` + `pytest` (or `npm run lint` + `npm test` from `web/` for frontend work) as its own self-check before reporting — not just the task's own tests, to surface cross-task breakage before the round-trip back — and require a single trailing newline on every file. For review, let the invoked skill post its PENDING GitHub review as a side-effect. The orchestrator's own full-suite gate (Workflow Rule 10) still runs regardless.

**Capture + process** the JSON `text` and `sessionId`:
- *Implementation:* review the diff, normalize output, then validate per Workflow Rule 10 (full suite + typecheck + lint) and commit with specific staging + a git note.
- *Review:* process findings via the `receiving-code-review` reception protocol (see the Submit PR section).

**Clean up (always)** — delete the ephemeral session directory under `~/.grok/sessions/<encoded-cwd>/<sessionId>/`:

```bash
find "$HOME/.grok/sessions" -type d -name "$sessionId" -prune -exec rm -rf {} +
```

**Parallelism:** where the task graph allows (disjoint files, no shared dependency on unlanded work), run multiple handoffs in parallel — isolated git worktrees where the tasks share risk of git-state collision, or the same worktree when they only touch disjoint files and no git operations are involved; otherwise sequential.

### Pre-Commit Checks

(Configure pre-commits based on project language/framework, e.g., ruff for Python, npm lint for JS/TS, etc.)

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

## Reflection

After every completed session, record useful workflow lessons in `docs/insights.md`. Do not include feature-specific implementation details. Cover commands executed, tools used, skills invoked, MCPs accessed, scripts created, workflow improvements, recurring failure modes, and skills worth adding or improving. Report the reflection to the user in chat and wait for explicit permission before deleting the worktree and branch.
