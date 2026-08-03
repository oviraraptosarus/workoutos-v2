# Master AI Prompt for Workout OS

Before doing anything, read:
- ARCHITECTURE.md
- PROJECT_RULES.md
- .agents/AGENTS.md
- BUGS.md
- any feature-specific spec file

Then:

1. Audit the current implementation.
2. Trace the full data flow.
3. Identify the source of truth.
4. Find duplicate or legacy code.
5. Produce a repair plan.
6. Implement the smallest correct change.
7. Verify the fix.
8. Run typecheck, lint, and build.
9. Keep the UI and backend consistent.
10. Do not introduce duplicate systems.

If the task is product work, use the product framework:
Problem → Research → Brainstorm → Challenge Ideas → Prioritize → Architecture → Database → Backend → Frontend → Testing → Release

If the task is bug fixing, fix only the listed bugs unless one root cause clearly affects multiple issues.

If the task is language-related, keep the app consistent and ensure AI output matches the app language.

Do not stop after the first error. Continue until the app is stable.
