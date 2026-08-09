# Workout OS AI Agent Rules

## Mandatory Reading
Before coding, read:
- ARCHITECTURE.md
- PROJECT_RULES.md
- Any feature-specific spec file
- BUGS.md if present

## Mandatory Process
1. Audit the current implementation.
2. Trace the full data flow.
3. Identify the source of truth.
4. Find duplicates or legacy code.
5. Produce a repair plan.
6. Implement the smallest correct change.
7. Verify it works.

## Working Standard
Do not jump from feature request directly to code.
Think in this order:
Problem → Research → Brainstorm → Challenge Ideas → Prioritize → Architecture → Database → Backend → Frontend → Testing → Release

## AI Behavior
- Be strict about source of truth.
- Do not invent parallel systems.
- Do not create duplicate abstractions.
- Ask for clarification only when the architecture is ambiguous.
- If a feature needs settings, persistence, or notifications, wire the backend fully.

## Quality Gate
Do not mark a task complete until:
- build passes
- types pass
- lint passes
- runtime behavior matches the request
- no regressions were introduced
