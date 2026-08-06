# Workout OS - Project Memory

**Last Updated:** 2026-08-06

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

## 4. Current Known Issues
*   Mobile vertical space is wasted on traditional dashboard cards.
*   Tasks persistence relied on frontend fallbacks because `priority` and `reminder_time` do not exist in the database schema.

## 5. Pending Work (Next Steps)
*   Begin implementing the "Now" screen / Execution Coach UI layer.
*   Implement frictionless voice/image logging flows to reduce manual input.
*   Refine the AI command center logic.

## 6. Important Decisions & AI Architecture
*   **Decision:** Pivot away from a generic dashboard to a single-action "Now" queue to reduce decision fatigue.
*   **Decision:** All UI changes must retain existing backend Supabase calls. No bypassing established hooks or duplicating API routes.
*   **Decision:** The AI Orchestrator must always gracefully degrade to fallback models on timeouts, rate limits, or network errors, and never abort completely unless it hits a fatal 400 Bad Request.
*   **Current AI Architecture:** AI requests are handled via a central `Orchestrator.ts` that acts as an Execution Coach. The Orchestrator gathers full app state (profile, workouts, nutrition, sleep, reminders, budget, AI memories) using `Promise.all` in `GlobalAICopilot.tsx`, and passes it to the AI.
*   **What the AI can access:** The AI can access profile data, goals, height/weight/age/gender, calorie targets, protein/carb/fat/fiber/water targets, workout history, sleep history, meal logs, journal/reflection logs, habits, planner tasks, reminders, budget, AI memory, streaks, progress photos metadata, notification preferences, language settings, timezone, time of day, and recent conversation history.
*   **How diet guidance works:** The AI actively helps fix diet by prioritizing calorie control, protein, fiber, hydration, and meal consistency. It uses actual logged meal data to reason across macros (including fiber) instead of guessing. It provides low-friction, practical meal advice based on actual progress.
*   **How reminder behavior works:** The AI enforces zero-friction execution. It creates or proposes reminders for water, meals, sleep, workouts, journaling, budget, etc. directly instead of only talking about them. Reminders are timely, non-spammy, and tied to real app data.

## 7. The AI Rulebook (`WORKOUTOS_AI_RULEBOOK.md`)
*   **Why it exists:** To prevent the AI from drifting into generic chatbot behavior. It strictly defines the AI as a practical health and fitness Execution Coach that uses real data.
*   **What it contains:** Definitive rules on data access, data reasoning, hallucination prevention, diet/workout/sleep/journal coaching, memory utilization, zero-friction tool execution, output style, and health safety.
*   **What changed:** The rulebook was codified into a permanent markdown file that comprehensively defines execution strategy for compound intents, ambiguity handling (sensible estimates), and direct correction handling.
*   **Future Contributors:** You MUST NOT break or contradict `WORKOUTOS_AI_RULEBOOK.md`. If any feature, prompt, or backend change conflicts with this rulebook, you must follow the rulebook first, explain the conflict, suggest the safest alternative, and do not silently violate it.

## 8. Dangerous Things Not to Break (Fragile Systems)
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
