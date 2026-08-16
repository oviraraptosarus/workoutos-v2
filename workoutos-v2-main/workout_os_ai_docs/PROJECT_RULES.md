# Workout OS Project Rules

These rules apply to every change in Workout OS.

## Core Rules

- Search before creating.
- Reuse before replacing.
- Extend existing code instead of duplicating it.
- Keep a single source of truth.
- Do not invent parallel implementations.

## Forbidden Patterns

- Duplicate API routes
- Duplicate Supabase clients
- Duplicate services
- Duplicate hooks
- Duplicate contexts
- Duplicate storage helpers
- Duplicate auth flows
- Duplicate schemas
- Mock data when real data exists
- Temporary or placeholder backend code
- Hardcoded secrets
- `*_v2`, `*_new`, `*_fixed` files unless explicitly requested

## Backend Rules

- Supabase is the source of truth.
- Never replace Supabase with localStorage.
- Never mix localStorage and Supabase as competing sources.
- Never bypass API routes if a route already exists.
- Never create a second database abstraction unless explicitly required.

## AI Rules

- AVA must use the orchestrator.
- Frontend should never call model providers directly.
- Provider failover must be handled server-side.
- Keep provider configuration in environment variables.

## Build Rules

After every implementation:
- Run TypeScript
- Run lint
- Run npm run build
- Fix all errors
- Repeat until clean

## Planning Rules

Before editing:
1. Explain the current problem.
2. Identify the source of truth.
3. List the files involved.
4. Describe the data flow.
5. Describe the fix plan.

Do not modify code until the plan is clear.

## Cleanup Rules

- Remove debug logs after debugging.
- Remove dead code after refactors.
- Remove unused imports.
- Do not leave TODOs unless explicitly requested.

## UI Rules

- Preserve the existing design language.
- Do not redesign unless asked.
- Keep theme support intact.
- Avoid layout regressions.

## Final Rule

If the requested change conflicts with the architecture, explain the conflict before coding.
