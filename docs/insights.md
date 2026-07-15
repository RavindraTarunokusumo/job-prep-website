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

