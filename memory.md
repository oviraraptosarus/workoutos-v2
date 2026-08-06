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
*   **AI Data Access:** The AI can access goals, biometrics, macro/water targets, workout/sleep/meal/journal logs, habits, tasks, reminders, budget, AI memory, notification preferences, timezone, and conversation history.
*   **Diet Guidance Strategy:** The AI prioritizes calorie control, protein, fiber, hydration, and meal consistency. It evaluates actual user logs instead of guessing. Fiber is strictly included in macro reasoning.
*   **Reminder Behavior Strategy:** The AI enforces zero-friction execution. If a user asks for a reminder, it creates one directly using sensible defaults (e.g., 09:00 for "tomorrow") rather than interrogating the user with clarifying questions.

## 7. The AI Rulebook (`WORKOUTOS_AI_RULEBOOK.md`)
*   **Why it exists:** To prevent the AI from drifting into generic chatbot behavior. It strictly defines the AI as a practical health and fitness Execution Coach.
*   **What it contains:** Definitive rules on data usage, hallucination prevention, diet/workout/sleep/journal coaching, memory utilization, zero-friction tool execution, output style, and health safety.
*   **What changed:** The rulebook was codified to replace scattered system prompts. The AI is now explicitly forbidden from interrogating the user over trivial missing details when executing tools (like reminders or tasks), prioritizing immediate execution via sensible defaults.
*   **Future Contributors:** You MUST NOT break or contradict `WORKOUTOS_AI_RULEBOOK.md`. If a feature or backend change conflicts with it, follow the rulebook first, explain the conflict, and suggest the safest alternative. Do not silently violate it.

## 8. Dangerous Things Not to Break (Fragile Systems)
*   **Orchestrator Retry Loop**: Do NOT throw errors inside the inner `while` loop in `Orchestrator.ts` unless it is an explicitly non-retryable API error (like 400). Throwing will bypass all OpenRouter/Gemini fallback models.
*   **Context Builder (`Promise.all`)**: Do NOT add raw `supabase.from()` promises to the AI context builder without `.catch()`. A single network failure will kill the entire AI chat request.
*   **Database Schema**: Do NOT modify existing `supabase.from().insert()` payloads without adding schema fallbacks, as the production DB schema is fixed and unmigrated for some columns (e.g., `tasks.priority`).
*   **AI API Boundary**: Do NOT bypass the AI Orchestrator API (`/api/ai/chat`) for AVA interactions.
*   **Source of Truth**: Never use `localStorage` as a primary source of truth; Supabase is the sole source of truth.
*   **Error Instrumentation**: ALWAYS use unique Error IDs (`ORCH-XXXX`) for backend crashes and return them cleanly to the UI. Never return generic "Failed to process request" messages.
*   **Tool Execution Validation**: ALWAYS throw explicit errors in client-side tool execution (`GlobalAICopilot.tsx`) if Supabase SQL operations fail. Never allow tools to fail silently without surfacing the error to the chat UI.

## 8. Developer Observability System (Telemetry)
*   **Architecture**: All AI request lifecycle events (prompts, context building, orchestrator responses, database writes, and errors) are logged asynchronously to the `telemetry_logs` Supabase table.
*   **Request IDs**: Every interaction generates a unique `request_id` (e.g. `REQ-YYYYMMDD-XXXXXX`) in `/api/ai/chat/route.ts`. This ID flows down into the orchestrator and back up to the frontend UI for end-to-end tracing.
*   **telemetryEngine**: A fire-and-forget singleton service (`src/services/telemetryEngine.ts`) handles asynchronous inserts to avoid blocking AI/UI threads.
*   **Developer Mode**: Activated via `?dev=unlock` (sets `workoutos_dev_mode` in localStorage). When active, `GlobalAICopilot.tsx` replaces standard error messages with an advanced Error Overlay containing the Stack Trace, Reason, and a link to the Telemetry Logs.
*   **Admin Dashboard**: `/admin` is a protected internal route that provides live visualization of System Health, Request Inspector, Error Center, Live Event Stream, and Database counts. Future developers must use this dashboard for debugging scaling issues rather than relying on console logs.
