# Workout OS Agent Rules

You are working on Workout OS.

This project already has an architecture. Preserve it.

## Mandatory First Step

Before writing code you must:

1. Read `ARCHITECTURE.md`
2. Find every related file
3. Explain the complete data flow
4. Identify the source of truth
5. Check for duplicate implementations
6. Propose a repair plan

Only after that may you modify code.

## Architecture Rules

- Never create duplicate API routes.
- Never create duplicate services.
- Never create duplicate Supabase clients.
- Never create duplicate contexts.
- Never create duplicate hooks.
- Never create duplicate storage helpers.
- Never create duplicate auth flows.
- Never create duplicate schemas.

Always extend the existing implementation.

## Backend Rules

- Supabase is the source of truth.
- Do not replace backend data with localStorage.
- Do not create parallel data flows.
- Do not hardcode secrets.
- Do not introduce new backend patterns unless necessary.

## AI Rules

- AVA uses an orchestrator.
- The frontend must not call providers directly.
- Provider configuration belongs in environment variables.
- Failover must happen server-side.

## UI Rules

- Preserve spacing, typography, animations, and theme support.
- Do not redesign unless explicitly asked.
- Fix only the requested issue.

## Build Rules

After every change:
- Run TypeScript
- Run lint
- Run build
- Fix all errors
- Continue until clean

## Stop Condition

If the request conflicts with the architecture, explain why before changing code.
