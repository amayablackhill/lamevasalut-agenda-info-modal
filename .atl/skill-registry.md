# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When writing React components - no useMemo/useCallback needed. | react-19 | C:\Users\tote8\.claude\skills\react-19\SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature. | issue-creation | C:\Users\tote8\.claude\skills\issue-creation\SKILL.md |
| When creating a pull request, opening a PR, or preparing changes for review. | branch-pr | C:\Users\tote8\.claude\skills\branch-pr\SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen". | judgment-day | C:\Users\tote8\.claude\skills\judgment-day\SKILL.md |
| Runtime control for Pinokio apps and launcher-managed tools (no explicit trigger in file). | pinokio | C:\Users\tote8\.claude\skills\pinokio\SKILL.md |
| Building 1-click launchers and apps with built-in launchers (no explicit trigger in file). | gepeto | C:\Users\tote8\.claude\skills\gepeto\SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI. | skill-creator | C:\Users\tote8\.claude\skills\skill-creator\SKILL.md |
| When writing Go tests, using teatest, or adding test coverage. | go-testing | C:\Users\tote8\.claude\skills\go-testing\SKILL.md |

## Compact Rules

### react-19
- Do NOT use `useMemo` or `useCallback`; rely on React Compiler optimization.
- Use named React imports only; avoid default `React` import patterns.
- Prefer Server Components by default; add `"use client"` only for interactivity/hooks.
- Use `use()` for promises/context reads where appropriate.
- Use server Actions with `useActionState` for form mutations and pending states.
- Treat `ref` as a normal prop in React 19; avoid `forwardRef` unless legacy interop forces it.

### issue-creation
- Always use issue templates; blank issues are not allowed.
- New issues must start with `status:needs-review`; approval is required before PRs.
- Route questions to Discussions, not Issues.
- Search for duplicates before opening a new issue.
- Fill all required template fields (repro steps, expected vs actual, environment).
- Use `gh issue create --template ...` and keep issue titles in conventional style.

### branch-pr
- Every PR must link an approved issue (`Closes/Fixes/Resolves #N`).
- Enforce branch naming: `type/description` with allowed conventional types.
- Add exactly one `type:*` label that matches the PR intent.
- Follow conventional commits and avoid non-standard commit trailers.
- Run required quality checks before merge (e.g., shellcheck where applicable).
- Keep PR body complete: summary, changes table, test plan, contributor checklist.

### judgment-day
- Orchestrate two blind parallel judge reviews; do not perform the review directly.
- Resolve and inject project standards into both judge prompts before delegating.
- Synthesize findings into confirmed/suspect/contradiction buckets.
- Fix only confirmed issues with a separate fix agent, then re-judge as required.
- Distinguish `WARNING (real)` vs `WARNING (theoretical)`; theoretical items are INFO.
- Never declare APPROVED until convergence rules are satisfied.

### pinokio
- Use `pterm` as primary control plane; do not switch to repo-local CLIs by default.
- Resolve and launch apps via `pterm search`, `pterm status`, `pterm run`, and `pterm logs`.
- Prefer already-ready apps; only use registry download flow when search has no suitable hit.
- For remote targets, use `ref` and `pterm upload` for path-based workflows.
- Reuse or create app-specific skill folders for durable automation instructions.
- Do not claim `pterm` missing until config, control-plane, and local-path checks all fail.

### gepeto
- For launcher work, mirror Pinokio examples and verify against `PINOKIO.md` before edits.
- Decide launcher type first (app vs plugin) and use the correct destination tree.
- Keep app logic in `app/` and launcher scripts at project root unless serverless exception applies.
- Capture runtime URL with regex + `local.set` pattern in `start.js` for web UIs.
- Prefer Pinokio APIs and cross-platform patterns over custom shell-specific hacks.
- Debug through launcher logs first; avoid touching app internals unless explicitly requested.

### skill-creator
- Create skills only for reusable, recurring patterns; avoid one-off skill creation.
- Use required frontmatter (`name`, description with Trigger, license, metadata).
- Keep guidance actionable: critical patterns, minimal examples, clear commands.
- Prefer local `references/` links over duplicating long docs in the skill file.
- Follow naming conventions based on scope (generic, project, testing, workflow).
- Register new skills in project agent index files after creation.

### go-testing
- Prefer table-driven tests for function behavior and edge-case coverage.
- Test Bubbletea model transitions directly via `Update` before broader integration.
- Use `teatest` for interactive TUI flow validation.
- Use golden files for stable rendered-output assertions.
- Mock system dependencies and use `t.TempDir()` for isolated filesystem tests.
- Run focused commands (`go test`, `-cover`, `-short`, targeted `-run`) per test scope.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| — | — | No project-level convention files found (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `GEMINI.md`, `copilot-instructions.md`). |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
