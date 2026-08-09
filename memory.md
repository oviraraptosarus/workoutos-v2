# Workout OS - Project Memory

**Last Updated:** 2026-08-08

## 1. Project State & Vision
*   **Current Phase:** Execution (Building the Relentless AI Execution Coach)
*   **Core Vision:** A premium, low-friction Relentless AI Execution Coach for distracted, low-activation users. The app must aggressively manage attention, reduce decision fatigue, and focus on one-tap execution.

## 2. Architecture Summary
*   **Frontend:** Next.js, React, Tailwind (Strict adherence to `DESIGN_SYSTEM.md`)
*   **Backend:** Supabase (PostgreSQL, Auth, Storage)
*   **AI:** AVA Orchestrator (Server-side routing to Gemini/OpenRouter)
*   **Rules:** Single source of truth. No duplicate logic. Supabase > Context > State.
*   **Dependencies:** Follow all rules in `PROJECT_RULES.md` and `ARCHITECTURE.md`.

## 3. Completed Work (Current Session)
*   **System Stabilization (2026-08-08)**:
    *   **Supabase PostgREST Fix (`useReminderEngine.ts`)**: Resolved 42+ console errors blocking dashboard render by wrapping ISO date strings with double quotes in the `.or()` filter logic to satisfy PostgREST syntax requirements.
    *   **Onboarding Flow Escape Hatch (`OnboardingModal.tsx`)**: Added a "Skip Onboarding" button to unblock returning users whose profiles lacked certain configuration flags, gracefully initializing default target configs.
    *   **State Hydration Data Loss Fix (`MoodEnergyCard.tsx`)**: Fixed a bug where empty local storage fallbacks would initialize mood/energy to 0 and blindly overwrite valid Supabase data on manual saves. The backend is now strictly respected as the absolute source of truth.
    *   **React Rendering & Styling Consistency (P1)**: Extracted the 10-segment sliders in `MoodEnergyCard` into a memoized `<RatingSlider />` component to drastically reduce re-renders. Standardized Tailwind classes (`bg-card-white`, `border-black/5`, `shadow`) across `MoodEnergyCard`, `TimeProgressWidget`, and `WeightLogCard` for a cohesive premium dashboard layout.
*   **Tasks Backend Fix**: Fixed critical backend data flow regression where tasks were failing to persist due to unmigrated `priority` and `reminder_time` columns (Handled gracefully via code fallbacks in `page.tsx`).
*   **Product Pivot Plan**: Conducted product brainstorm and rebuild spec, proposing and approving the Execution Coach pivot.
*   **AI Orchestrator Fix (Production Blocker)**: 
    *   **Root Cause 1 (Abort)**: The `fetch` API timeout triggered an `AbortError`. Because it's a native `DOMException`, it lacked the custom `isRetryable` property. The orchestrator treated undefined as a fatal error, bypassed all fallback models, and threw `Orchestrator error: This operation was aborted` up to the UI.
    *   **Root Cause 2 (Dashboard Context)**: `GlobalAICopilot.tsx` used `if (dailyLogRes.data)` to verify context. If a user hadn't logged anything today, the data was null, making the Context Audit wrongly report Dashboard as failing. Furthermore, unhandled Supabase network exceptions in `Promise.all` were silently killing the entire AI pipeline.
    *   **Fixes Applied**: 
        *   Modified `Orchestrator.ts` to explicitly detect `AbortError` and natively failover to fallback models rather than aborting.
        *   Wrapped all Supabase context queries in `GlobalAICopilot.tsx` with `.catch()` to ensure partial context loads gracefully even if one module fails.
        *   Fixed the Dashboard check to use `!dailyLogRes.error` so empty days are correctly treated as "loaded".
*   **LLM Provider Failover Fix**: Added `gemini-2.5-flash` and `openrouter/auto` to the `DEFAULT_PRIORITY_LIST` in `llm.ts` to gracefully bypass invalid API keys and offline free models.
*   **Client-Side Crash Fix**: Added missing `fiber` initializations to `MacroGoals` and missing `useRef` hooks in `RawDataAITransformerModal.tsx` that were causing white-screen crashes on load.
*   **Reminder UI Sync Fix**: Fixed `GlobalAICopilot.tsx` to explicitly dispatch `workout_os_refresh` upon creating reminders so the UI updates instantly, and passed `title` into `useReminderEngine.ts` so custom notifications show the actual task title instead of "Custom".
*   **Execution OS V3 Final Build:** Completely deprecated the old `/planner` tab and replaced it with the 4-Hub Execution OS.
    *   **Now Hub (War Room):** Features a full-screen distraction-free Mission Mode timer to enforce single-task execution.
    *   **Brain Hub:** Integrated native Web Speech API for Zero-Friction Voice Brain Dumps.
    *   **Goals Hub:** Full Macro Vector definition UI synced directly to the backend `execution_goals`.
    *   **Reflect Hub:** End of day reflection.
*   **Premium Welcome Flow:** Built a Replika-inspired, story-mode onboarding flow at `/welcome` featuring native animations and deep gradients, sitting before the sign-up screen to build emotional momentum.
*   **V3 Additive Backend Hookup:** Successfully deployed `execution_profiles`, `execution_goals`, `task_execution_scores`, and `behavior_patterns` to Supabase, and hooked them up to Ava's `Promise.all` context array safely. Modified AI System Prompts and suggestion chips to push seamless task additions.
## 4. Current Known Issues
*   Mobile vertical space is wasted on traditional dashboard cards.
*   Tasks persistence relied on frontend fallbacks because `priority` and `reminder_time` do not exist in the database schema.

## 5. Pending Work (Next Steps)
*   Begin implementing the "Now" screen / Execution Coach UI layer.
*   Implement frictionless voice/image logging flows to reduce manual input.
*   Refine the AI command center logic.

## 6. Important Decisions & AI Architecture
*   **CRITICAL PRINCIPLE (Extend, Never Replace):** The current backend is production-critical. Existing tables, APIs, authentication, AI routing, notifications, planner, workouts, nutrition, budget, and dashboard must continue working exactly as they do today. Execution OS is an ADDITIVE capability layer.
    *   Never rename existing tables. Never drop columns. Never replace APIs. Never rewrite existing services. Never migrate users to a different architecture. Never delete existing UI.
    *   Instead: Add new tables, services, adapters, feature flags, wrappers, routes, and AI capabilities.
*   **IMPACT ANALYSIS REQUIREMENT:** Before making ANY change or writing ANY code, an Impact Analysis MUST be output to the user covering: (1) Existing modules affected, (2) Existing tables affected, (3) Existing APIs affected, (4) Existing UI affected, (5) Risk level, (6) Rollback strategy, (7) Migration strategy, (8) Backward compatibility check.
*   **SUPABASE & DOCKER RULES:** Do NOT assume Local Supabase. Check if the project is connected to hosted Supabase. DO NOT require Docker unless explicitly necessary. Generate migrations compatible with the hosted database and execute them via CLI (or output for SQL Editor).
*   **Decision (2026-08-07 - V3.1 Additive Architecture):** The Execution OS is an **additive capability layer**, not a replacement architecture. Every migration must be 100% reversible in under 5 minutes without data loss. Use adapters instead of rewrites. Use composition instead of replacement. Use feature flags where appropriate.
*   **Decision (2026-08-07 - V3 Pivot):** The "Planner" concept is dead. We are building a systemic **Execution OS**. The core loop is: Capture → AI Understands → AI Prioritizes → Execute ONE Task → AI Learns. The hierarchy is Life Area → Goal → Project → Task → Micro Task.
*   **Decision:** Replaced the Planner tab with 4 hubs: **Now** (Execution Queue), **Reflect** (Reviews), **Goals** (Hierarchy), **Brain** (Capture). 
*   **Decision:** Ava is split logically into 3 personas: Planner, Coach, Analyst. She is now stateful, remembering execution patterns (e.g., procrastinates after 8 PM).
*   **Decision:** Tasks now have an **Execution Probability** (0-100%) and cost **Execution Budget** points (capped at 100/day).
*   **Decision:** Added **Mission Mode** (War Room override for acute focus). The new North Star metric is **Execution Rate**.
*   **Decision:** All UI changes must retain existing backend Supabase calls. No bypassing established hooks or duplicating API routes.

## 7. Operational Workflow (Master Controller)
*   **Workflow:** Before ANY modification: Read PROJECT_RULES & memory.md → Identify affected modules → Load framework docs (ARCHITECTURE, DATABASE_FRAMEWORK, BACKEND_FRAMEWORK, FRONTEND_FRAMEWORK, AI_PROMPT) → Run QA_FRAMEWORK mentally → Update memory.md → Update BUGS/RELEASE_CHECKLIST.
*   **Never:** Create duplicate implementations, new Supabase clients, parallel schemas, or new API routes if an existing one can be extended.
*   **Decision:** The AI Orchestrator must always gracefully degrade to fallback models on timeouts, rate limits, or network errors, and never abort completely unless it hits a fatal 400 Bad Request.
*   **Current AI Architecture:** AI requests are handled via a central `Orchestrator.ts` that acts as an Execution Coach. The Orchestrator gathers full app state (profile, workouts, nutrition, sleep, reminders, budget, AI memories) using `Promise.all` in `GlobalAICopilot.tsx`, and passes it to the AI.
*   **What the AI can access:** The AI can access profile data, goals, height/weight/age/gender, calorie targets, protein/carb/fat/fiber/water targets, workout history, sleep history, meal logs, journal/reflection logs, habits, planner tasks, reminders, budget, AI memory, streaks, progress photos metadata, notification preferences, language settings, timezone, time of day, and recent conversation history.
*   **How diet guidance works:** The AI actively helps fix diet by prioritizing calorie control, protein, fiber, hydration, and meal consistency. It uses actual logged meal data to reason across macros (including fiber) instead of guessing. It provides low-friction, practical meal advice based on actual progress.
*   **How reminder behavior works:** The AI enforces zero-friction execution. It creates or proposes reminders for water, meals, sleep, workouts, journaling, budget, etc. directly instead of only talking about them. Reminders are timely, non-spammy, and tied to real app data.

## 7. The AI Rulebook (`WORKOUTOS_AI_RULEBOOK.md`)
*   **Why it exists:** To prevent the AI from drifting into generic chatbot behavior. It strictly defines the AI as a practical health and fitness Execution Coach that uses real data.
*   **What it contains:** Definitive rules on data access, data reasoning, hallucination prevention, diet/workout/sleep/journal coaching, memory utilization, zero-friction tool execution, output style, and health safety.
*   **Future Contributors:** You MUST NOT break or contradict `WORKOUTOS_AI_RULEBOOK.md`. If any feature, prompt, or backend change conflicts with this rulebook, you must follow the rulebook first, explain the conflict, suggest the safest alternative, and do not silently violate it.

## Execution OS & Planner (V3 Final State)
- **Execution OS replaces Planner:** The old `/planner` has been completely deprecated. `/planner` is now the Execution OS. The experimental `/execution` route is no longer needed.
- **The 4 Hubs:** The UI relies on native theme variables (`glass`, `bg-surface-container`) to ensure flawless dark/light mode rendering.
    - **Now Hub:** Replaces standard lists with a single highest-priority target ("Relentless Mode"). Hitting "Enter War Room" overrides the full screen, hiding bottom navigation, and forces a binary Mission Accomplished/Abort choice.
    - **Brain Hub:** Unstructured brain dump area enhanced with Web Speech API for voice dictation.
    - **Goals Hub:** Macro hierarchy (Life Area → Goal) directly persisted to backend.
    - **Reflect Hub:** Analyzes completed tasks and logs behavioral patterns via Ava.
- **Docker / Supabase CLI Constraint:** Added `package.json` scripts (`supabase:push`, `supabase:status`, etc.) to run Supabase CLI commands locally without needing Docker for pure remote pushes.
*   **What should not be broken:** The `WORKOUTOS_AI_RULEBOOK.md` is the single source of truth for the AI's behavior and must be followed.
*   **Orchestrator Retry Loop**: Do NOT throw errors inside the inner `while` loop in `Orchestrator.ts` unless it is an explicitly non-retryable API error (like 400). Throwing will bypass all OpenRouter/Gemini fallback models.
*   **Context Builder (`Promise.all`)**: Do NOT add raw `supabase.from()` promises to the AI context builder without `.catch()`. A single network failure will kill the entire AI chat request.
*   **Database Schema**: Do NOT modify existing `supabase.from().insert()` payloads without adding schema fallbacks, as the production DB schema is fixed.
*   **AI API Boundary**: Do NOT bypass the AI Orchestrator API (`/api/ai/chat`) for AVA interactions.
*   **Source of Truth**: Never use `localStorage` as a primary source of truth; Supabase is the sole source of truth.
*   **Error Instrumentation**: ALWAYS use unique Error IDs (`ORCH-XXXX`) for backend crashes.

## 9. Developer Observability System (Telemetry)
*   **Architecture**: All AI request lifecycle events are logged asynchronously to the `telemetry_logs` Supabase table.
*   **Request IDs**: Every interaction generates a unique `request_id` for end-to-end tracing.
*   **telemetryEngine**: A fire-and-forget singleton service (`src/services/telemetryEngine.ts`).
*   **Developer Mode**: Activated via `?dev=unlock`. Shows advanced Error Overlay containing Stack Trace and Reason.
*   **Admin Dashboard**: `/admin` provides live visualization of System Health and Error Center.

## 10. The Ruthless Simplification Incident
*   **The Incident:** During a UI/UX polish pass ('Ruthless Simplification'), critical user-facing dashboard components (WeightLogCard, TouchGrassNudge, QuickNotes, TimeProgressWidget) were unilaterally removed from src/app/dashboard/page.tsx under the misguided assumption that they constituted 'bloat'.
*   **Why It Was a Stupid Decision:** The AI assumed that aesthetic minimalism superseded functional density without validating the utility of those specific widgets with the user. Weight tracking, daily nudges, and time widgets form the core operational view for the user's daily habits. Removing them actively degraded the product's utility in favor of an arbitrary 'clean' look. A dashboard's purpose is information density; hiding core metrics forces the user to dig for them, violating the core principle of a 'low-friction Relentless AI Execution Coach'.
*   **The Resolution:** The dashboard changes were immediately reverted via git checkout src/app/dashboard/page.tsx. All widgets were restored to their original positions.
*   **The Lesson (Never Repeat This):** NEVER remove functional components, widgets, or data-tracking cards from the UI solely for the sake of 'simplifying' or 'decluttering' the layout, unless explicitly directed by the user to remove that *specific* component. Aesthetic improvements must ONLY alter CSS/styling (e.g., glassmorphism, padding, colors) and NEVER alter the functional architecture or data visibility of a page.
