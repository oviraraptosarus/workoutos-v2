# Workout OS Project Rules

## Never
- Create duplicate implementations.
- Create new Supabase clients unless absolutely required.
- Create parallel schemas.
- Create new API routes when an existing one can be extended.
- Hardcode secret keys.
- Leave TODOs for unfinished core flows.
- Use mock data when real backend data exists.
- Guess at backend behavior without tracing it.

## Always
- Reuse the existing architecture.
- Trace the full data flow before coding.
- Fix the root cause, not just the visible symptom.
- Keep the UI consistent with the current design language.
- Preserve user data and existing functionality.
- Verify the fix after implementation.
- Run typecheck, lint, and build after changes.

## Naming
- No `v2`, `v3`, `final`, `new`, `fixed` duplicates unless explicitly requested.
- Prefer one canonical file per responsibility.

## Backend
- Supabase is the source of truth.
- Every write must have a corresponding read path.
- Every feature that persists data must have schema support, RLS, and storage rules where needed.

## AI
- AI must be treated as a system with rules, not a code generator.
- Always validate capability, provider, model, and output language.

## Bug Fixing
- Reproduce the bug.
- Find the exact cause.
- Fix the smallest correct thing.
- Verify no regressions.
