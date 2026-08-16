# Global Project Rules

## 1. Absolute Directives
- **Never Assume Local Setup**: Always generate migration scripts compatible with the hosted Supabase environment.
- **Extend, Never Replace**: Do not delete existing API routes or database columns just because they seem unused in one component. The architecture is additive. Use Adapters or wrappers instead of ripping out foundational code.
- **Single Source of Truth**: The Supabase database is the sole arbiter of truth. Do not maintain parallel logic trees in LocalStorage or frontend global state that overwrite the backend.

## 2. Agent Decision Framework (For AI Code Generation)
Whenever an AI Agent modifies this codebase, it MUST adhere to this operational loop:
1. **Context Check**: Read these rules and the `ARCHITECTURE.md` before writing code.
2. **Impact Analysis**: Identify what modules, tables, APIs, and UI components are affected by a change. If a change touches core tables, stop and verify RLS policies.
3. **Frictionless Mentality**: When building UI flows, the user should perform the minimum number of clicks to achieve their goal. 
4. **Resilience**: Assume APIs will fail, networks will drop, and users will refresh midway through a flow. Always wrap external calls in `try/catch` blocks and degrade gracefully.

## 3. Strict Coding Standards
- **TypeScript**: Use strict typing. Avoid `any`. Define interfaces in a dedicated `types.ts` or closely coupled to the component if it's localized.
- **Naming Conventions**: 
  - Database columns: `snake_case`.
  - Frontend components/interfaces: `PascalCase`.
  - Variables/Functions: `camelCase`.
- **Comments**: Only comment the "why", not the "what". If the code is complex enough to require explaining "what", refactor it to be readable.

## 4. The "No Hallucination" Rule
- If an API or feature does not exist, do not hallucinate a client-side wrapper for it and pretend it works. You must write the actual backend migration, the serverless route, and the frontend logic.
- Do not create mock data arrays unless explicitly prototyping a UI. Always hook up to Supabase immediately.
