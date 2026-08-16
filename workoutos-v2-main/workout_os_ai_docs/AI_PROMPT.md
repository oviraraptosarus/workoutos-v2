# Prompt for AI

Read the following files first:

- `ARCHITECTURE.md`
- `PROJECT_RULES.md`
- `.agents/AGENTS.md`

Then follow them exactly.

## Task

Audit the current Workout OS codebase and determine the correct architecture for the requested backend/UI change.

## Instructions

- Do not write code before explaining the current architecture.
- Find every related file.
- Trace the full data flow.
- Identify the source of truth.
- Detect duplicate or legacy implementations.
- Explain the repair plan first.
- Only then make the smallest safe change.

## Rules

- Reuse the existing implementation.
- Do not create duplicate services or API routes.
- Do not create duplicate Supabase clients.
- Do not introduce new backend patterns unless required.
- Do not change unrelated UI or features.
- Preserve the current theme and design language.
- Keep Supabase as the source of truth.
- Keep secrets out of code and out of prompts.

## Verification

After changes:
- Run TypeScript
- Run lint
- Run npm run build
- Fix all errors
- Verify the data actually saves and reloads correctly

## Output format

1. Architecture summary
2. File list
3. Data flow
4. Problems found
5. Repair plan
6. Code changes
7. Verification results
