# Specs workflow

Accepted implementation specs live in this directory.

## Naming

```
YYYY-MM-DD-<short-slug>.md
```

Example: `2026-07-15-mvp-phase-0-1-foundation-landing.md`

## Rules

1. A chat prompt is not implementation authority. Specs are.
2. Do not implement feature work from a draft with unresolved **blocking** open questions.
3. Any scope change updates the active accepted spec first, then `TODO.md`.
4. One Autopilot / PR cycle should reference a single primary active spec path (linked from `TODO.md`).

## Active specs

| Spec | Status | Scope |
|------|--------|-------|
| [2026-07-15-mvp-phase-0-1-foundation-landing.md](./2026-07-15-mvp-phase-0-1-foundation-landing.md) | **Accepted (merged PR #1)** | Phase 0 foundation + Phase 1 RoleReady landing (JOB-18) |
