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
3. (Spec Writing + Lightweight Plan) For feature implementation, write a detailed specification document following a spec-driven development process (requirements, data models, interfaces, workflows, edge cases, success criteria, and constraints). Do not write implementation plans or code until the spec is complete and accepted. Read the docs (see [Project Map](#project-map)) and use GitNexus as your primary means to understand the codebase. For debugging or minor patching, skip this step. Once the spec is accepted, produce a **lightweight implementation plan** that serves as the Grok implementer's contract — file structure, task decomposition, per-task **Interfaces** (Consumes/Produces signatures), build order, and risks. Do **not** inline verbatim per-step code or exact shell commands; the implementer regenerates those from the contract. The plan's value is the cross-task contract (who calls what, in what order), not transcribed code — that contract is what catches the class of bug a narrowly-scoped implementer cannot see (e.g. a changed signature breaking another caller). This preserves the spec→plan→implementation independent-verification chain at a fraction of the planning cost.
4. (Implementing) Log tasks and sub-items in `TODO.md` first, then implement each task by delegating to a **Grok subagent as the implementer** via the non-interactive CLI (`grok -p "<task instructions>" --yolo --output-format json`), one ephemeral session per task (per the [Grok Build Implementation/Review Handoff](#grok-build-implementationreview-handoff)). Capture the `sessionId` from the JSON result, review and validate the produced changes, run `npm run lint` (and typecheck/tests) before each commit, attach a git note afterwards using the [template](.github/git_notes_template.md), then delete the ephemeral `~/.grok/sessions/.../<sessionId>` directory for that implementation subagent. Commit any files the subagent wrote immediately (per Workflow Rule 9). Cross each sub-item and item once done. Where the task graph allows — independent tasks with disjoint files and no shared dependency on unlanded work — run multiple implementer subagents in parallel using isolated git worktrees; otherwise implement sequentially. After each delegated task, the main agent independently validates with the **full** test suite plus typecheck and lint before committing — never trust the implementer's scoped self-report (it grades only against its narrow task scope and will report green while a cross-cutting change, e.g. a modified signature breaking another caller, stays broken). Also review the diff and normalize implementer output (e.g. trailing newlines) during review. If Grok fails, fall back to the `/subagent-driven-development` skill.
5. (Submit PR) Finally, follow the instructions in the [Submit PR](#submit-pr) workflow — using non-interactive `grok -p` commands where possible to trigger reviews — and notify the user once every step has been completed. If Grok fails, spawn native subagents as a fallback.
6. (Post-PR) Update documentation files once the PR has been merged and archive completed TODO items from `TODO.md` into `docs/iterations/archive/`; ensure each subitem in the TODO are tagged with the commit hash and each session are tagged with the merge ID - `TODO.md` should only contain **active or future** work only. These Post-PR doc/archive commits are pushed **directly to `main`** (no PR — the feature PR is already merged); fast-forward only, never force.
7. (Reflection) Conclude the session by doing the [Reflection](#reflection) exercise; the Reflection commit is likewise pushed **directly to `main`** (no PR). After receiving confirmation from the user, delete the worktree and branch.

### Workflow Rules

1. Every TODO sub-item should land as its own commit.
2. Any extension or modification to the task should be logged in the TODO.
3. Use specific staging, never `git add -A`.
4. Never force-push, reset `--hard`, merge or amend unless explicitly asked.
5. Keep comments sparse, naming clear, abstractions minimal, and avoid compatibility shims.
6. When lint/typecheck/test fails only on files you did not touch, note it as pre-existing and proceed — do not attempt workarounds that affect other files.
7. After submitting the PR, delegate the code review (and optional security review) to Grok as ephemeral subagent sessions via the non-interactive CLI (`grok -p ... --output-format json --yolo`). Capture the `sessionId` from the JSON result, process the review output/side-effects (e.g. PENDING review posts), then immediately delete the corresponding `~/.grok/sessions/.../<sessionId>` directory for that security-review or code-review subagent task. See the detailed examples and cleanup logic in the [Submit PR](#submit-pr) section. Do not rely on GitHub Copilot Code Review. Rigorously address findings using the reception protocol.
8. After context compaction resumes, run `git status` before any other action — the summary describes intent, not exact commit state.
9. Commit any files written by subagents immediately; do not advance the workflow with a dirty tree. For Grok-based subagents (security-review, bundled code-review, etc.), always capture the sessionId via `--output-format json` and delete the ephemeral chat session directory after the delegation completes and findings are processed.
10. After a delegated implementation task, validate with the **full** suite + typecheck + lint (not the implementer's scoped tests) before committing. A per-task implementer self-scopes its own verification and structurally cannot see cross-task breakage (e.g. a changed signature breaking another caller); only the full project-level run catches it.

### Grok Build Implementation/Review Handoff

The canonical contract for delegating any unit of work — implementation tasks (Step 4) or PR reviews ([Submit PR](#submit-pr)) — to an ephemeral Grok subagent. Both flows share this mechanism; only the prompt and the post-processing differ.

**Invoke** (headless, single-turn, no TUI):
```
grok -p "<self-contained prompt>" -m grok-composer-2.5-fast --effort <LEVEL> --yolo --output-format json
```
- `-p` / `--single`: headless single-turn mode; creates an ephemeral chat session.
- `-m` / `--model`: model name; always use Composer 2.5 Fast for any task.
- `--effort`: set thinking level; choose between `high` or `xhigh` depending on task difficulty.
- `--yolo` (or `--always-approve`): auto-approves tools so the delegation runs unattended.
- `--output-format json`: returns structured output including `text` (final summary) and `sessionId` (required for cleanup).

**Prompt** must be self-contained — the subagent starts cold with no session context: point it at the exact spec/plan section or PR number, name the precise file scope, and state the boundaries. For implementation, forbid all git operations (the main agent commits), require it to run the **full** `npm test` + `npx tsc --noEmit` as its own self-check before reporting (not just the task's own tests — this surfaces cross-task breakage before the round-trip back), and require a single trailing newline on every file. For review, let the invoked skill post its PENDING GitHub review as a side-effect, and set `NO_COLOR=1` (or feed `gh … --json`) so ANSI codes in `gh` output don't break inline-comment line matching. The orchestrator's own full-suite gate ([Workflow Rule 10](#workflow-rules)) still runs regardless.

**Capture + process** the JSON `text` and `sessionId`:
- *Implementation:* review the diff, normalize output, then validate per [Workflow Rule 10](#workflow-rules) (full suite + typecheck + lint) and commit with specific staging + a git note.
- *Review:* process findings via the receiving-code-review reception protocol (see the [Submit PR](#submit-pr) section).

**Clean up (always)** — delete the ephemeral session directory under `~/.grok/sessions/<encoded-cwd>/<sessionId>/`:
```powershell
Get-ChildItem -Path "$env:USERPROFILE\.grok\sessions" -Recurse -Directory -Filter $sessionId |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
```
Bash equivalent: `find "$HOME/.grok/sessions" -type d -name "$sessionId" -prune -exec rm -rf {} +`

**Parallelism:** where the task graph allows (disjoint files, no shared dependency on unlanded work), run multiple handoffs in isolated git worktrees; otherwise sequential.

### Submit PR

1. Fill out the **[Template](.github/pull_request_template.md)** and submit the PR (capture the PR number/URL, e.g. via `gh pr create --json number,url`).

2. (Optional) If the changes affect security (or explicitly stated), delegate a non-interactive security review to a Grok subagent (ephemeral session). Always cite justification. Capture the session ID and clean it up afterwards so the review chat session is deleted. PowerShell example:
   ```powershell
   $prNum = gh pr view --json number -q .number
   $prompt = "Use the /security-review skill on PR #$prNum. Report only HIGH-confidence newly introduced vulnerabilities from the diff."
   $json = grok -p $prompt --yolo --output-format json
   $reviewText = ($json | ConvertFrom-Json).text
   $sessionId = ($json | ConvertFrom-Json).sessionId

   # Main agent processes $reviewText here (e.g. incorporate findings, address via receiving-code-review logic)

   # Delete the ephemeral Grok subagent chat session created for this review
   Get-ChildItem -Path "$env:USERPROFILE\.grok\sessions" -Recurse -Directory -Filter $sessionId |
       Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
   ```

3. Generate the main professional code review by delegating the Grok bundled reviewer per the [Grok Build Implementation/Review Handoff](#grok-build-implementationreview-handoff). Capture the PR number first (`$prNum = gh pr view --json number -q .number`) and use the review prompt:
   ```
   Use /bundled:review --pr #$prNum. The skill should post a PENDING GitHub review. After it completes, provide a very brief summary of what was done.
   ```
   The skill does the heavy lifting (diff collection, reviewer persona, posting the PENDING GitHub review as a side-effect); the handoff is just the delegation + cleanup wrapper. Capture the returned `sessionId`, process the summary, then delete the session per the handoff. Do not rely on GitHub Copilot Code Review.

- Rigorously address the review findings before considering the task complete. Use the reception protocol defined in [.codex/skills/receiving-code-review/SKILL.md](.codex/skills/receiving-code-review/SKILL.md):
  - Read the full feedback first.
  - Verify each item technically against the actual codebase.
  - Push back (with clear technical reasoning) on items that seem incorrect, unclear, or low-value.
  - Implement one change at a time and test it.
  - Avoid performative agreement ("You're right!", "Great catch!"); just state what was done or ask for clarification.

**Note for mixed Claude/Grok environments:** In Claude Code sessions you may use `/code-review:code-review` (the official plugin) as a fallback, but prefer the Grok bundled reviewer when available for higher-quality structural feedback and proper PENDING review workflow.

### Reflection

After every session completion, you reflect on how the workflow pertaining to the workflow and agent harness - the commands you executed (and which failed consistently), the tools you used, skills invoked, MCP accessed, etc. **Do not include anything feature-specific**. For example, when the Codebase Graph output is too verbose or if certain powershell commands keeps failing. This is not about the features you implemented, but about *how* you implemented them. Write this down in [Insights](docs/insights.md) and then suggest workflow updates to the user in chat.

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