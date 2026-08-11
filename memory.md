# Workout OS - Project Memory

**Last Updated:** 2026-08-08

## 1. Project State & Vision
*   **Current Phase:** Execution & Premium UI/UX Polish (Building the Relentless AI Execution Coach)
*   **Core Vision:** A premium, hyper-intuitive, low-friction Health & Execution OS for distracted, non-technical users. The app must aggressively manage attention, reduce decision fatigue, and focus on one-tap execution. 
*   **Design Philosophy (The "Apple" Approach):** The UI must be highly aesthetic but remarkably simple. Avoid complex tech jargon, nested menus, or overcrowded interfaces. Use deep styling (glassmorphism, clean typography, haptic micro-animations) to make the app feel expensive and delightful. 
*   **Widget Navigation System:** The dashboard is not a static display—it is an interactive launchpad. *All dashboard widgets must act as intuitive hyperlinks to their respective full-page sections*. Users should be able to naturally click on what they see (e.g., the Content Vault widget, Sleep Trends chart) and be taken directly to the detailed view, requiring zero learning curve.

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
*   **iOS Premium UI Overhaul (2026-08-09)**:
    *   **AI Copilot Migration:** Deprecated the Android-style floating action button (FAB) for the AI Copilot. Integrated Ava directly into the Top Navigation Bar using a futuristic `Orbit` icon. Fixed overlapping z-index bugs that caused the orb to clip into bottom cards on mobile.
    *   **Execution OS Native Sizing:** Refactored the `planner/page.tsx` tabs (Now, Brain, Goals, Reflect) to use compact, iOS-native padding (`p-6`), font sizing (`text-2xl`), and scaled-down icon wrappers (`w-10 h-10`). Removed horizontally scrolling segmented tabs in favor of evenly distributed flex boxes to match iOS native segmented controls.
    *   **Design Skill Extraction:** Extracted all premium iOS design rules (glassmorphism, micro-animations, compact spatial architecture, and typography) into a reusable AI skill (`premium-ios-design/SKILL.md`) to standardize future agent UI/UX decisions without requiring heavy prompting.
*   **UX Retention Hooks & Haptics (2026-08-09)**:
    *   **Casino-style Feedback Loops:** Wired `useRewardSystem().triggerSuccess()` across core actions (Dashboard task completion, hitting daily water targets, saving meal logs, and logging weight). This provides an intense sensory reward (confetti pop, satisfying chime, double-buzz haptic) mimicking Instagram/gambling mechanic feedback loops to maximize user retention and habit formation.
    *   **Dashboard Config Persistence:** Fixed `AuthContext.tsx` payload mapping so that personalized dashboard widget layouts properly persist to the Supabase `profiles.dashboard_config` backend JSON field.
    *   **Typography Detail:** Removed raw JSON string double-quotes from `DailyBriefingModal.tsx` quote renderer to display proper clean single-styled quotes in the UI.
    *   **Strict AI Orb Enforcement:** The `Orbit` + `Sparkles` pulsing orb is the strictly defined Ava Copilot UI. Never replace this with generic generic Tailwind elements or static generic icons.
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

## 11. Cutthroat Precision & Anti-Hallucination Framework
*   **Mandatory Critical Thinking:** Agents MUST NOT blindly generate code. Before invoking any file-modification tools, you must execute a "Mental Sandbox" trace: 
    1. **Factual Grounding:** Do I have the precise schema/types? Have I run a `grep_search` to verify the variable names?
    2. **Task Adherence:** Does my planned solution *exactly* address the user's prompt without introducing unsolicited "improvements" or hallucinating missing features?
    3. **Tool Validation:** Am I using the absolute most specific tool? Am I avoiding nested bash hacks (`cat` inside `bash`)?
*   **Zero-Hallucination Output:**
    *   Do not invent UI elements, placeholder data, or "Coming soon" blocks unless explicitly requested.
    *   If a requirement is ambiguous, STOP and ask the user rather than guessing and building a convoluted hallucinated architecture.
    *   When returning outputs, be cutthroat and concise. State exactly what was changed, the architectural reason, and how to verify it. Avoid fluff.
*   **Database & Migration Discipline:**
    *   All new Supabase SQL changes must be strictly written to a correctly timestamped file in `supabase/migrations/` (e.g., `YYYYMMDDHHMMSS_description.sql`).
    *   Do not leave loose `.sql` files in the project root or scattered in `src/`.
    *   Ensure all new SQL functions (RPC) and tables have corresponding Row Level Security (RLS) policies explicitly defined in the same migration file.
    *   Never assume existing tables; always verify with `seed.sql` or existing migrations.
    *   **Comprehensive Session Updates (2026-08-11)**:
        *   **Global UI/UX Core**: Shifted settings/configuration buttons strictly to the bottom of views to declutter headers. Tightened top margins on the dashboard for a more premium iOS-style feel. Resolved light mode color scheme issues universally, including fixing duplicate theme toggle options.
        *   **Dashboards & Layouts**: Added the Content Vault (YouTube URL) widget directly to the dashboard, updated its icon to a premium blue bookmark, and added automatic YouTube title fetching. Fixed the bug preventing dashboard customization layouts from persisting correctly.
        *   **Notifications & Headers**: Fixed the top navigation z-index/overflow bug that was cutting off the notification bell drop-down menu. Fixed the missing daily quote rendering issue. Fixed the bug where duplicate em-dashes appeared before the quote author.
        *   **Calendar & Charts**: Re-enabled the calendar view based on user request, but permanently removed `<` and `>` arrows globally in favor of sleek native date pickers. Added localized pagination arrows (`<` `>`) directly above historical data charts (Sleep, Weight) to navigate historical weeks without changing the global app date.
        *   **Diet & Workouts**: Fixed contrast and visibility issues for the Diet section in Light Mode. Fixed Light Mode styling for the Custom Workout builder.
        *   **Finance & Other Tools**: Resolved the bug in the Expense log component. Fixed the "+00" counter bug where numbers weren't incrementing or decreasing correctly. Fixed the profile picture UI component formatting.
        *   **AI (Ava) Agent Enhancements**: Banned the use of hyphens and em-dashes globally in Ava's system prompt (Rule 12). Enforced "well furnished" text formatting (short paragraphs, proper line breaks, bolding) to prevent wall-of-text responses. Updated the AI logo for Light Mode to make it stand out more clearly. Improved voice-to-text dictation bugs. Finally, enhanced Ava's conversational feedback to prevent generic 'Done.' responses, adding contextual confirmations and auto-navigation when she generates major artifacts like workouts.
        *   **Widget Navigation & Feedback Rule**: Enforced a permanent rule that all dashboard widgets must act as hyperlinks to their respective dedicated pages. Fixed the Content Vault save function (which was silently failing due to a mismatched 'consumed' vs 'status' database column), added a green 'Saved!' tick-mark confirmation, limited the dashboard preview to 3 items, and added a '+X more' link that routes directly to /vault.
        *   **Vault Widget Enhancement**: Added a 'VIEW ALL >' button to the Content Vault widget header to match the Daily Quests aesthetic, reinforcing the widget-as-hyperlink architecture.
        *   **Strict Memory Protocol**: Enforced a new overarching rule: The AI MUST automatically log all significant UI changes, bug fixes, and feature additions into memory.md after every interaction, without requiring a reminder from the user.
        *   **Vault Dedicated Hub**: Built a new dedicated /vault page featuring a premium Apple-style grid layout, tabbed navigation (Unread/Consumed), and a sticky URL input bar so users can save new content directly from the hub without returning to the dashboard.
        *   **Sleep Chart Details**: Injected a custom dynamic Tooltip into the Sleep Chart to display the exact date (e.g. 11/08) above the tracked hours, and added a dynamic Month/Year indicator (e.g. AUG 2026) directly next to the pagination controls to give users temporal context when scrolling back through historical sleep data.
        *   **Light Mode Vault Buttons**: Refactored hardcoded 'bg-white text-black' classes across VaultWidget and the /vault page into semantic 'bg-primary text-primary-foreground' classes. This ensures all primary action buttons and active tabs perfectly invert and remain high-contrast in Light Mode.
        *   **Premium CSS Rendering Bug Fix**: Removed hardcoded absolute gradient overlays (bg-white/5) from the MoodEnergyCard. These were causing harsh banding lines and clipping artifacts in Safari and dynamically resizing views. The glass-card-premium root CSS now natively handles all frosted glass styling flawlessly.
        *   **Voice-First Daily Journal Redesign**: Completely replaced the old 13-field journal form with a premium voice-to-text check-in. 4 states: Idle (big mic button with glow ring), Recording (live animated waveform + real-time transcript via Web Speech API), Processing (Ava loading state), Done (Ava's polished 2-3 sentence summary + raw words + Re-record/Save actions). Built a new /api/ai/daily-summary endpoint that takes raw voice transcript and returns a clean journal entry. All colors use semantic design tokens (secondary, surface-container, on-surface) so it auto-adapts to Light and Dark Mode.
        *   **Voice-to-Text Duplication Bug Fix (GlobalAICopilot)**: Fixed the root cause of the "hellohellohello" repetition bug in Ava's voice input. The bug was iterating event.results from index 0 on every onresult callback, which re-read all previous results on top of each new one. Fixed by iterating from event.resultIndex only, accumulating finals in a separate string (finalSessionText), and keeping only current interim in a separate variable. Also enabled interimResults=true for live word-by-word feedback while speaking.
        *   **Ava Journal Summary Bug Fix**: The daily-summary API was calling orchestrator.chat() which does not exist. Fixed to use orchestrator.generateContent() matching the pattern in the report route. Also fixed a silent failure pattern where an empty avaSummary would cause the entire Ava section to vanish. Now the Ava Summary section is always visible in the done state with three possible sub-states: loading spinner, the summary text with a Regenerate button, or a dashed Generate button the user can tap manually if the auto-call failed.
        *   **Multiple Sleep Logs Per Day**: Added a session type pill selector (Night Sleep / Nap / Rest) to the EnhancedSleepLogger. Each session type auto-fills sensible default times (Night: 23:00-07:00, Nap: 13:00-14:00, Rest: 15:00-15:30). Each log stacks in Recent Logs independently, and the card now shows a colored emoji badge and bedtime-to-waketime instead of just the log-time.
        *   **Smart Reminders**: Updated the /api/cron/process-reminders/route.ts logic to include End-of-Day reminders. At 21:00 (9:00 PM) local time, the backend now checks if the user has logged their sleep and journal entries for the day. If they haven't, it sends a Push Notification reminding them to wrap up their day. It tracks the last_daily_reminder_date inside 
otification_settings to prevent duplicate pings.
        *   **Persistent Nag Reminders**: Redesigned the /api/cron/process-reminders cron job to feature a "nagging" engine. 
            *   **Tasks**: If a task passes its deadline, the system now reminds the user every 4 hours until it's completed.
            *   **Daily Logs**: Starting at 6:00 PM, the system reminds the user to log sleep and journal entries every 2 hours until fulfilled.
        *   **Brain Dump & Reflect Hub Integration**: Refactored the dashboard Planner Hub. Merged the robust voice-recording system from EndOfDayReflection into a new BrainDump.tsx component that extracts tasks to a checklist for user approval before saving to the DB. Also moved the EndOfDayReflection.tsx off the sleep page and centralized it on the planner page's 'Reflect' tab, styled to match the new UI.
