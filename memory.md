# Workout OS: Development Memory

> **Note:** This file serves strictly as a chronological changelog for major structural, UI, and backend changes. For core rules and architecture patterns, refer to `.agents/AGENTS.md` and `.agents/architecture.md`.

## Recent Milestones & Changes

### August 17, 2026 - Premium UI Polish & Aesthetic Refinement
- **Anatomical Heatmap Perfection**: Replaced the jagged, low-poly heatmap SVG with a hyper-refined, continuous Bezier curve (`C`/`Q`) silhouette. The body now has flawless heroic proportions (massive V-taper, thick quads, defined core) and the muscle overlays (Chest, Back, Arms, etc.) map perfectly without any disjointed floating islands.
- **Shadow War Room Aesthetic**: Completely overhauled `GhostRivalWidget.tsx` to adhere to premium iOS design principles. Removed the cramped, dense columns in favor of a sleek, wide glass-card layout. The header now floats completely outside the card, and stats (Workouts, Sleep, Tasks, Water) are displayed in an ultra-clean, elegant comparison row layout.

### August 17, 2026 - Phase 10 Reboot: Shadow War Room, Anatomical Heatmap & UX Refinements
- **Shadow War Room Rebuild**: Replaced static XP bar and generic taunts with the cinematic "Shadow War Room" comparing real user workout volume, duration, savings rate, and task execution against Shadow's mirrored stats. Rebuilt API prompt using Freudian psychology and Andrew Tate-style dismissive rival energy. Enforced name resolution to strictly use the user's real first name (`fullName` / `name`) instead of alias handles (`THEMAN`).
- **Anatomical Recovery Heatmap**: Replaced generic abstract rectangular boxes with an **Artistic Anatomical Human Silhouette Vector** (Front / Back toggle). Combined automated DB fatigue decay tracking (`workout_logs`) with a new **Real-World Manual Soreness & DOMS Logger** allowing users to tap any muscle group to flag mild soreness, heavy DOMS, or injury/strains directly into `daily_logs` metadata.
- **Active Workout Control**: Added a dedicated **"Stop & Discard"** button alongside "Finish Workout" in `ActiveSplitCard.tsx` to allow stopping active workouts without corrupting database logs.
- **Light Mode UI System**: Standardized adaptive light/dark mode styling (`dark:text-white text-zinc-900`, `dark:border-white/5 border-zinc-200`) across `GhostRivalWidget`, `WorkoutShadowTaunt`, `BudgetShadowTaunt`, `BurnGoalTracker`, `TopNav`, and `AppLogo`.
- **Quick Action Pill**: Positioned the floating `+` action pill to the bottom right (`right-6`) with smooth right-aligned menu expansion.

### August 17, 2026 - AI Orchestrator Debugging & Token Limit Expansion
- **Route.ts Reversion**: Per user request, completely replaced `src/app/api/ai/chat/route.ts` with the exact backup version from `D:\Workout OS\workoutos-v2-main`. This effectively reverted the 8192 token limit bump back to the original 800-token cap in that file, restoring the original backup logic exactly as requested.
- **Global Token Limit Bump**: Fixed an issue where complex AI generation requests (like generating a full dumbbell HIIT workout plan) were crashing or truncating. Root cause was the orchestrator's `maxOutputTokens` being artificially capped at 1500-2500 across `api/ai/chat`, `api/ai/report`, and the core fallback provider instances (`OpenAIProvider`, `AnthropicProvider`, `GeminiProvider`). Increased the ceiling to `8192` globally.
- **OpenRouter & Gemini Key Debugging**: Diagnosed a multi-layered failure in the AI copilot that triggered the generic "high load / invalid keys" fallback error:
    - **OpenRouter Pre-flight Check**: Bumping the token limit to 8192 caused OpenRouter to instantly throw an HTTP 402 (Payment Required) because the user account balance was at $0 and could only theoretically afford ~850 tokens.
    - **Free Model Deprecation**: OpenRouter recently revoked the `:free` tier for `meta-llama/llama-3.3-70b-instruct` and `google/gemma-3-27b-it`, causing HTTP 404 errors when the orchestrator attempted to fall back to them.
    - **Resolution**: Reconfigured the `.env` `MODEL_PRIORITY_LIST` to use active, confirmed free models (`meta-llama/llama-3.1-8b-instruct:free` and `google/gemini-2.0-flash-lite-preview-02-05:free`) and ensured the native Gemini key was formatted correctly.

### August 16, 2026 - Daily Briefing Modal Data Fix & Enhancements
- **Briefing Data Bug Fix**: Fixed DailyBriefingModal showing stale/default values (2959ml, 1635 kcal, 150g protein) instead of actual user profile goals. Root cause: `useDailySnapshot.ts` read non-existent `userProfile.proteinGoal` (always fell back to 150) — protein target is stored in `targetConfig.protein`. Also, `daily_burn_goal` DB column existed but was never loaded into `UserProfile` in AuthContext. Fixed both field reads and added `daily_burn_goal` to the profile interface, fetch, and save logic.
- **Slide 1 Progress Bars**: Replaced flat text chips with real progress bars showing actual numbers (e.g., `2400 / 3000 ml`) with color-coded fill states. Each metric (Hydration, Workout, Nutrition, Tasks) gets its own row with a thin iOS-style progress indicator.
- **Streak & Momentum Pills**: Surfaced `snapshot.streak` and `snapshot.momentumScore` as compact pills at the top of the Execution Review slide (previously fetched but never rendered).
- **Sleep Target on Slide 3**: Added missing Sleep target row with Moon icon and purple accent to the Tomorrow's Targets / Today's Battle Plan slide.
- **Bottleneck Severity**: Color-coded bottlenecks — critical items (missed workout, zero tasks) show red `#ff453a`, warnings (low hydration, partial tasks) show amber `#ff9f0a`. Empty state now shows a centered "Peak Efficiency" illustration instead of plain text.
- **Mode-Aware Labels**: Morning mode slide 1 now reads "Yesterday's Recap" instead of the generic "Execution Review" label.
- **Quote Screen Greeting**: Added time display and personalized greeting (`Good Evening, Srivats`) above the motivational quote on the fullscreen intro slide.
- **Swipe Gesture Support**: Added `onTouchStart`/`onTouchEnd` handlers with 50px horizontal threshold for native-feeling swipe navigation between slides.
- **"Let's Go" Deep-Link**: Final slide button now navigates to `/workout` (morning) or `/sleep` (evening) instead of just closing the modal.

### August 12, 2026 - AI Copilot Persistence & Time-Travel Logging
- **Ava Vision AI Migration**: Completely removed the mock-AI "Green Sparkle" feature (`RawDataAITransformerModal`) to strictly enforce the Apple design philosophy and avoid clunky, hardcoded offline text parsing. Upgraded Ava's central intelligence in `route.ts` with Rule 15: whenever a user uploads an image of food and asks to log it, the LLM-Orchestrator's native vision models (Gemini/Claude/GPT-4o) are forced to visually analyze the dish, extract ingredients, estimate calories, and automatically execute the `log_nutrition` tool, populating the new Ingredients Cascade seamlessly.
- **Meal Cascade Data Loss Fix**: Discovered that `dietStorage.ts` was silently stripping `ingredients` and `icon` properties during `saveMealsForDate` because the `meal_entries` table wasn't configured for them. Created a SQL migration to add `ingredients` (JSONB) and `icon` (TEXT) columns, ensuring the AI's generated UI data (and emoji icons) persist perfectly. Also updated the `RawDataAITransformerModal` mock AI to inject ingredients arrays into its offline parsing results so the cascade works globally.
- **Meal Cascade iOS UI Polish**: Fixed a mobile layout bug where `flex-col` pushed the MealLogger action buttons (Edit, Delete, Cascade Chevron) to a new line on small screens. Refactored to a strict `flex-row` with proper truncations. Realigned the Ingredients Cascade to perfectly match the `premium-ios-design` rulebook: pulled the "Estimated Breakdown" header outside the glass container, added top/inner light-catching gradients to the nested card, and replaced generic green accents with the native Apple `#0a84ff` blue.
- **Persistent AI Conversations**: Built a backend infrastructure (`ai_conversations` table) with Row Level Security to persistently save all Ava AI chat logs. Added a sleek, iOS frosted glass History sidebar to the Global AI Copilot, allowing users to seamlessly view, resume, or clear past chats, resolving the issue of AI amnesia. Added strict idempotent protections to the SQL migration and a forced PostgREST cache refresh (`NOTIFY pgrst, 'reload schema'`) to prevent dashboard relation/column desync errors.
- **Ava UI Polish**: Removed redundant UI elements (like duplicate close/delete buttons) from the Ava chat header. Implemented strict Apple Design philosophy by using authentic `#0a84ff` native blue buttons, subtle `backdrop-blur-3xl` deep glassmorphism effects, and highly refined typographic spacing for the History Sidebar. Added native UI `alert()` pop-ups to immediately catch any silent Supabase failures during chat saving/loading per debugging rules.
- **Time-Travel Logging**: Discovered and fixed a critical limitation where Ava would blindly log activities to the *current day* even when the user specified "yesterday" or a past date. Injected a dynamic `logDate` parameter into the AI's core tool schemas (`log_workout`, `log_sleep`, `log_nutrition`, `log_water`, `add_expense`, `add_income`). Updated the `GlobalAICopilot.tsx` tool execution engine to intercept this date and properly override the global `dateKey`, enabling perfect historical tracking directly through chat.

### August 11, 2026 - Hub Restructuring & AI Enhancements
- **Content Vault Implementation**: Built a new dedicated `/vault` page featuring a premium Apple-style grid layout, tabbed navigation (Unread/Consumed), and a sticky URL input bar. Added the VaultWidget to the dashboard with automatic YouTube title fetching.
- **Light/Dark Mode Fixes**: Refactored hardcoded 'bg-white text-black' classes across VaultWidget and the `/vault` page into semantic `bg-blue-500` or `bg-primary` classes. This ensures all primary action buttons perfectly invert and remain high-contrast in Light Mode.
- **Voice-to-Text Robustness**: Fixed the root cause of the "hellohellohello" repetition bug in Voice Input. The bug was iterating `event.results` from index 0 on every callback, which re-read all previous results. Fixed by using a `finalRef` approach.
- **Brain Dump & Reflect Hub Integration**: 
    - Moved the `EndOfDayReflection.tsx` off the sleep page and centralized it on the planner page's 'Reflect' tab.
    - Merged the robust voice-recording system into a new `BrainDump.tsx` component that uses an LLM to extract tasks to a checklist for user approval before saving to the `tasks` DB.
    - Updated the `daily_logs` Supabase schema to explicitly support `raw_transcript` (Text) and `reflection` (Text) for the Reflect Hub.
- **Persistent Nag Reminders**: Redesigned the `/api/cron/process-reminders` cron job to feature a "nagging" engine. 
    - If a task passes its deadline, the system reminds the user every 4 hours until it's completed.
    - Starting at 6:00 PM, the system reminds the user to log sleep and journal entries every 2 hours until fulfilled.
- **Architecture Overhaul**: Cleaned up scattered `.md` files in the root directory into a unified `.agents/AGENTS.md` master rulebook and a `.agents/architecture.md` blueprint.
- **View Past Reflections**: Upgraded the EndOfDayReflection component to fetch and display the user's saved reflection from Supabase when they navigate to past dates using the global Date Picker, introducing a read-only 'viewing' state.
- **Daily Journal UI Restoration**: Completely redesigned the Reflect Hub (EndOfDayReflection.tsx) to restore the preferred premium UI. Re-introduced the "DAILY JOURNAL" card layout with an editable "YOUR WORDS" inset box, distinct Re-record/Save buttons, a word counter, and a "Recent Logs" list fetching the last 5 entries directly from the database.
- **iOS Voice Message Re-design**: Replaced the Daily Journal text-area form with a sleek, audio-only iOS-style Voice Message bubble widget in EndOfDayReflection.tsx. Features native Apple blue coloring, a CSS-animated waveform, and automatic background processing to strictly adhere to the premium-ios-design philosophy.
- **Restored Voice-First Daily Journal**: Fully restored the EXACT Voice-First Daily Journal design and architecture built by Claude, per user request. Restored the 4 distinct states:
    - **Idle**: Big glowing microphone button.
    - **Recording**: Real-time dancing CSS waveform with live transcript overlay underneath, and a red stop button.
    - **Processing**: Ava's sparkles pulse while summarizing the raw voice input.
    - **Done**: Side-by-side cards (Ava's Summary vs Your Words) with Edit capabilities.
    All colors completely rely on semantic tokens (secondary, surface-container, on-surface) for flawless Dark/Light mode integration.
- **Daily Journal UI Enhancements**: Upgraded the action buttons to use iOS native pill shapes, added the ability to edit Ava's Summary, added an explicit "Save Edits" feature in viewing mode, and added a delete button to Recent Journals.
- **Unified UI Theme**: Applied the premium 'Brain Dump' header and container styling (gradient borders, squircle icons, large typography) across the Content Vault and Daily Journal components for a completely unified, Apple-like dashboard experience.
- **Execution OS Icons & Quests Styling**: Changed the generic Target icon to specialized ones for Daily Quests (Zap / lightning) and Macro Goals (Trophy). Fully applied the premium 'Brain Dump' container styling (frosted glass, gradients) to the Daily Quests tab to match the rest of the interface perfectly.
- **Unified Spacing & Icon Colors**: Tightened the gap spacing between the header icons and titles across all Execution OS tabs (from gap-4 to gap-3) to match Apple's native spacing conventions. Standardized all icon colors in the Execution OS headers to use the exact same Apple Blue (\secondary\) for perfect visual consistency.
- **Journal Archive Redesign**: Replaced the standard 5-item list with a Notion-style grouped accordion UI. Journal logs are now grouped by Month/Year (e.g., "August 2026") and the header floats outside the widget glass container per Apple guidelines.
- **Multiple Journals per Day**: Upgraded the Reflect Hub's save mechanism to support multiple entries on the same day by appending new entries with a timestamp instead of overwriting existing ones.
- **AI Context Integration**: Added `reflection` and `raw_transcript` fields to the Global AI Copilot's `daily_logs` fetch, granting the AI access to read past journal entries.
- **Data Export & Import**: Built a comprehensive `DataExportImport` component in the Profile settings that seamlessly exports all major Supabase tables (journals, sleep, workouts, tasks, meals, AI memories) to a JSON backup file and supports upserting data from a backup.
- **Mobile Voice & Auto-Save Fixes**: 
    - Resolved a critical bug where `SpeechRecognition` failed to transcribe on mobile devices (iOS/Android). The issue was caused by `getUserMedia` locking the microphone to render the real-time CSS waveform. Implemented a user-agent check to bypass Web Audio API on mobile and simulate the waveform, allowing native dictation to take exclusive mic access.
    - Simplified the "Save Entry" flow by removing the prompt popup and auto-accepting Ava's summary directly to reduce friction.
    - Fixed a bug in the global AI Copilot's voice handler where the `onresult` listener double-accumulated previously confirmed voice chunks on mobile.
- **FOUC & Splash Quote Fixes**: 
    - Fixed a Light Mode Flash of Unstyled Content (FOUC) on initial load by injecting a synchronous, blocking `<script>` tag in `layout.tsx` to read the theme from `localStorage` before React hydrates.
    - Fixed the Daily Quote mismatch between the Splash Screen and the Dashboard Header by syncing the randomly chosen quote to `sessionStorage`.
    - Prevented the Splash Screen from triggering on every page load by persisting a `workout_os_splash_seen` flag in `sessionStorage`.
- **Reflect Hub Enhancements**:
    - Converted the Live Transcript view into an interactive `<textarea>`. Users can now tap the text at any point while recording to pause the microphone and seamlessly switch to manual typing, mimicking the native iOS dictation keyboard experience.
- **Dictation Platform-Aware Architecture**:
    - Discovered and neutralized a fatal event flaw in Android Chrome where `continuous=true` fails to advance `resultIndex`, falsely marks historical interim snapshots as `isFinal=true`, and appends them to `e.results` recursively. 
    - Completely replaced the standard Web Speech loop with a Platform-Aware State Machine across all 5 dictation interfaces. On Desktop, it preserves standard behavior. On Android, it exclusively reads the final index and disables `auto-restart` to prevent Android's background speech service from compounding the audio buffer upon reconnection.

### August 12, 2026 - Brain Dump UI Refactor & Smart Task Routing
- **Brain Dump UI Refactor**: Completely redesigned the Brain Dump UI and AI extraction logic. Instead of breaking unstructured dumps into a fragmented array of "readings," the AI now generates a single, cohesive journal summary block (formatted with paragraphs and bullets). Any actionable tasks extracted are displayed below the summary as an unchecked checklist, preventing them from polluting the user's task list by default. Users must explicitly check tasks to save them, alongside saving the summary directly to their journal via a toggle.
- **Smart Task Routing (NLP Time Extraction)**: Upgraded the 'Daily Quests' quick-add input (`DashboardTasks.tsx`) and Global AI Copilot to utilize Smart AI parsing. If a user types a time (e.g., "make my bed at 7am") in any task input, the AI flawlessly extracts the ISO timestamp and sets it as `reminder_time`. The tasks are now correctly routed to the Reminders widget instead of falling back to generic daily quests.
- **Push Notification Stability**: Fixed a silent hanging issue in `usePushNotifications.ts` by explicitly registering the Service Worker before awaiting `.ready`. Added explicit VAPID key validation to throw clear native UI alerts if keys are missing from the Vercel environment, drastically improving debugging visibility.
- **Store Fallback Resilience**: Hardened `useTaskStore.ts` insertion logic to gracefully degrade and retry if the Supabase `recurrence_rule` column isn't migrated yet, preventing silent failures when users add tasks on an out-of-sync production database.

### August 13, 2026 - Budget Tracker Overhaul & iOS Styling Refinements
- **Budget Tracker Layout Fix**: Moved the `FinancialReminders` widget to the bottom row next to the Income and Expense logs to fix a vertical layout overlap bug where it squeezed underneath the Category Breakdown chart.
- **Financial Reminders Backend**: Migrated the `FinancialReminders.tsx` widget from generic `localStorage` to a fully synchronized cloud backend using the Supabase `financial_reminders` table, implementing RLS policies and optimistic UI rendering.
- **Automated Financial Push Notifications**: Integrated financial reminders into the existing cron processor (`src/app/api/cron/process-reminders/route.ts`). Added a `notification_sent` tracker column. The system now automatically dispatches push notifications exactly once on or after the reminder's due date at 9:00 AM local time.
- **Budget Log Pagination**: Implemented custom pagination state ("Show More" logic, starting at 5 items) for both `IncomeTable.tsx` and `ExpenseTable.tsx` to prevent long lists from stretching the UI vertically, keeping the tracker interface dense and Apple-like.
- **iOS Modals Refinement**: Updated `EditFoodModal.tsx` to strictly adhere to the `premium-ios-design` rulebook. Removed generic blocky backgrounds and replaced them with `glass-card-premium`, standard `font-label-sm` typographic styling, and authentic iOS blue (`#0a84ff`) active states for toggles.

 -   2 0 2 6 - 0 8 - 1 3   -   F i x e d   ' O n   p a c e '   a n d   ' O v e r   p a c e '   b a d g e   s t y l e s   i n   t h e   B u d g e t S u m m a r y C a r d s   t o   p r o p e r l y   d i s p l a y   i n   b o t h   l i g h t   a n d   d a r k   m o d e s .  
 
- **UI Fix**: Fixed New Macro Goal form layout on the planner page to stack Life Area and Target Date vertically on mobile devices, preventing horizontal squishing of the dropdown.

 -   2 0 2 6 - 0 8 - 1 3   -   F i x e d   ' O n   p a c e '   a n d   ' O v e r   p a c e '   b a d g e   s t y l e s   i n   t h e   B u d g e t S u m m a r y C a r d s   t o   p r o p e r l y   d i s p l a y   i n   b o t h   l i g h t   a n d   d a r k   m o d e s .  
 
- **UI Fix**: Fixed New Macro Goal form layout on the planner page to stack Life Area and Target Date vertically on mobile devices, preventing horizontal squishing of the dropdown.

- **UI Fix**: Fixed overflowing 'Save to Archive' buttons in the Brain Dump component by using flex-wrap, ensuring proper wrapping on mobile screens.

- **UI Fix**: Fixed overflowing 'Discard All' and 'Save Selected' buttons in the Brain Dump component by using flex-col on mobile screens, and added bottom padding to ensure they are fully visible above the bottom navigation bar.

- **UI Fix**: Redesigned Brain Dump bottom action buttons (Discard All & Save Selected) to be side-by-side, equal-width, pill-shaped buttons with whitespace-nowrap to prevent wrapping and adhere to the premium iOS design rules on mobile.

- **Feature Addition**: Added ability to log context (description) and categorize items in the Content Vault. Modified content_vault schema, and implemented expandable UI forms in src/app/vault/page.tsx and src/app/planner/page.tsx following premium iOS guidelines.

- **Bug Fix / Feature**: Enabled backdating of journal entries in `EndOfDayReflection.tsx` by replacing the `isToday` check with a check for `offsetDays > 0`, allowing users to navigate to past dates and log forgotten journal entries.

- **Bug Fix**: Fixed a bug in `VaultWidget.tsx` where the "more saved in your vault" count was capped at +7 due to a `.limit(10)` query. Replaced it with a `{ count: 'exact' }` query to get the true total count of unread items. Also updated the Mark Consumed action to properly set `status: "consumed"` and refetch to keep the widget grid full.

- **Bug Fix**: Fixed a silent database failure in `GlobalAICopilot.tsx` when the AI logged sleep times in conversational formats (like "10 PM"). The system previously used a naive string length check (`length === 5`), which incorrectly appended ":00" to "10 PM", creating invalid Postgres time strings (e.g., "10 PM:00"). This caused the database upsert to fail saving the bedtime/waketime (resulting in "—" dashes on the Sleep Card) despite saving the total hours. Implemented a robust Regex time parser to standardize all AI outputs into valid "HH:MM:00" 24-hour formats before saving.

- **Crash Fix**: Fixed a fatal client-side React rendering crash in `EditFoodModal.tsx` that occurred whenever a user clicked on a logged food item to edit it. The component was trying to use undeclared variables (`isSubmitting` and `Loader2`) and a missing import (`Check`) for its submit button state, causing an instant `ReferenceError`. Removed the undefined variables and correctly imported `Check` from `lucide-react` to restore full editing functionality.

- **Legal Compliance**: Completely rewrote `src/app/privacy/page.tsx` and `src/app/terms/page.tsx` for India-specific legal compliance. Privacy Policy now covers all features (AI Copilot, voice dictation, Content Vault, Budget Tracker, sleep/fitness/nutrition logging, push notifications, Data Export, Brain Dump) under the DPDP Act 2023, IT Act 2000, and SPDI Rules 2011, including a Grievance Officer, Data Principal rights, cross-border transfer disclosures, and retention policies. Terms of Service covers health/medical disclaimer, AI hallucination disclaimer, financial tracking disclaimer, voice dictation consent, child mode, acceptable use, and dispute resolution under Indian law. Both documents updated to version effective 15 August 2026.

- **UI & Feature Polish**: Upgraded the Welcome Screen (`AuthScreen.tsx`) to a premium iOS bento-box layout with animated gradient blurs, floating logo, and elevated typography. Updated the Data Export/Import utility (`DataExportImport.tsx`) to include all recently added tables (`content_vault`, `ai_conversations`, `financial_reminders`, `progress_photos`), ensuring complete 100% data portability for user backups.

- **Bug Fix**: Fixed a critical caching issue where XP gains (from logging workouts, meals, tasks) were successfully saving to the database but failing to update on the frontend UI until a hard browser refresh. Implemented a real-time event listener (`workout_os_xp_awarded`) in `AuthContext.tsx` that instantly triggers a profile refetch and updates the XP Progress Bar dynamically.
- **UI Enhancement**: Completely overhauled the XP naming/ranking system in `xpService.ts`. Replaced the repetitive "IRON" titles (e.g., "IRON NOVICE", "IRON TRAINEE") with a cleaner, premium RPG progression system (NOVICE → RECRUIT → APPRENTICE → CHALLENGER → WARRIOR → VETERAN → GLADIATOR → MASTER → GRANDMASTER → TITAN → LEGEND).
- **Critical Auth Fix**: Fixed an "infinite loading screen" bug on the Authentication page where client-side rendering would hang indefinitely. Implemented a robust 3-second safety fallback timeout in `AuthContext` to ensure the session loading state always resolves, preventing users from getting locked out if local storage or Supabase fetch intercepts hang.
- **Welcome Slideshow Ambiance**: Overhauled the `/welcome` pre-login slideshow to adhere to the Apple Intelligence premium aesthetic. Injected rich, animated background blobs (`bg-[#0a84ff]` and `bg-[#bf5af2]`) with dynamic pulsing, updated the typography for maximum contrast, and modernized the "Get Started" CTA button.
- **App Stability & Hydration**: Cleaned up a dead `Onboarding` component import in `AuthScreen.tsx` that could silently cause client-side hydration freezing in Next.js edge cases.

### August 15, 2026 - AVA Overhaul & Voice Dictation Upgrade
- **Complete Rebranding**: Overhauled the core AI persona from "AERIS" to "AVA" across the entire codebase per user instruction. The AI is now explicitly defined as "Ava, a warm personal AI writer".
- **Retroactive XP System**: Built a server-side retroactive XP script (`/api/admin/retro-xp`) to scan the database and mathematically backfill any missing XP for the user's entire 13-day history based on past journal entries, sleep logs, workouts, tasks, and meals.
- **Login Screen UI/UX & Dark Mode**: Applied strict Dark Mode preference and Apple-style ambient background blobs (`blur-3xl`) to `AuthScreen.tsx` and login forms. Replaced muddy inputs with high-contrast, premium styling to dramatically improve text legibility.
- **Security Enhancements**: Implemented a secure password change flow in `profile/page.tsx` that strictly requires users to verify their current password and successfully re-authenticate before saving a new one, preventing unauthorized access.
- **Journal Voice Dictation Upgrade**: Major overhaul to the Reflect Hub's voice dictation flow without breaking the existing Android duplication patch:
    - **Simultaneous MediaRecorder**: Ava now captures a physical audio file (`audio/webm` fallback to `mp4`) simultaneously with the native Web Speech API transcript, allowing users to download their original raw audio.
    - **Editable Truth**: Separated "Ava's Summary" and "Your Words" into two distinct truths. Both fields now have native inline `<textarea>` editing states.
    - **Regenerate Architecture**: Added a ✨ Regenerate feature that allows the user to manually edit their raw transcript and feed it back to the AI for a fresh summary without re-recording.
    - **Unified Persistence**: Deprecated the restrictive save modal. Clicking "Save Entry" now idempotently persists both the exact raw dictation and the finalized AI summary into Supabase concurrently.
- **Dictation Accent Customization**: Added a 'Dictation Accent' dropdown (e.g., US English, Indian English) to the global Profile Settings (`page.tsx`), injecting this preference into `SpeechRecognition.lang` across both the Reflect Hub and Global AI Copilot to drastically improve transcription accuracy for non-US users.
- **Persistent Audio Backup**: Created a new Supabase Storage bucket (`journal_audio`) with strict RLS policies. The system now automatically uploads the raw `.webm` audio blob to the cloud when a journal entry is saved, and stores the resulting `audio_url` in the `daily_logs` table so the AI and user can access the original voice recording later.
- **Archive Editing**: Upgraded the Journal Archive bottom-sheet modal to support editing. Users can now click into any historical journal entry, toggle an edit mode, and retroactively modify either their raw transcript or Ava's summary.
- **Microphone Bug Fix**: Fixed a critical bug in `EndOfDayReflection.tsx` where the microphone button stopped working and failed to record audio. The issue was traced back to a recent commit that reorganized the mobile `getUserMedia` try-catch block but accidentally deleted the core `spawnRecognition()` call and UI state updates (`isRecordingRef.current = true` and `setState('recording')`). Restored these lines to ensure dictation properly starts and the UI updates to the recording state.
- **Quote Engine Overhaul**: Purged 3000 synthetic quotes and replaced them with 115 highly curated, verified quotes featuring specific insights and belief challenges. Refactored `quoteEngine.ts` to support the new schema.
- **Ava Persona Enforcement (Out of Bounds)**: Updated the AI `systemContract.ts` to strictly forbid Ava from generating Python code or responding to requests outside of health, fitness, productivity, and life coaching, ensuring she stays strictly in character.
- **Natural AI Summaries**: Rewrote the system instructions for the Daily Summary and Brain Dump endpoints to completely forbid Markdown formatting (e.g., asterisks, hashtags, bullet points, robotic section headers). Summaries now look like natural, human-written journal paragraphs.
- **Execution OS Headers UI Polish**: Unified the section headers for Mission Countdowns, Daily Quests, and Brain Dump to use a naked white icon (`text-white`) without any wrapper container, ensuring a minimalist contrast against dark backgrounds per user request.

### August 16, 2026 - Crash Prevention & TypeScript Fixes
- **Client-Side Exception Fix**: Resolved a critical "app not opening" crash caused by a schema desync in `DailyBriefingModal.tsx`. The component attempted to read `.subtext` from `quotes.json`, which was recently overhauled to use `.author`. This threw an `undefined.replace` TypeError, breaking the entire React hydration tree on dashboard mount. Fixed by matching the new JSON schema.
- **TypeScript Overhaul**: Ran full `type-check` and systematically fixed 6 hidden runtime bugs across the app:
    - Fixed an undefined `setParsedReadings` function call in `BrainDump.tsx`.
    - Added missing `Trash2` icon import in `profile/page.tsx` that caused ReferenceErrors.
    - Added missing `minYear` and `maxYear` props to `IOSDatePickerProps` to restore type safety.
    - Handled `undefined` emails in the `signInWithPassword` flow in `profile/page.tsx`.
    - Fixed an unreachable code block in `usePushNotifications` inside `reminders/page.tsx`.
    - Fixed an invalid `recurrenceRule` property (changed to `recurrence_rule`) in `DashboardTasks.tsx`.

### August 16, 2026 - Ava AI Coaching Rulebook Overhaul
- **Root Cause Fix: Missing Workout Template Tool**: Discovered that `save_workout_template` was defined in the old v2 inline route.ts but was **never ported** to the modular `toolDefinitions.ts`. This was the primary reason Ava treated "make me a training plan" as `add_task` — the LLM had no workout generation tool available and defaulted to the nearest mutation.
- **System Contract Rewrite**: Completely rewrote `systemContract.ts` from a generic 7-section document to a comprehensive coaching rulebook with: (1) Nuclear Anti-Task-Dumping Rule with explicit whitelist of task-trigger phrases, (2) 6-branch Intent Decision Tree (COACHING → ANALYSIS → LOGGING → RETRIEVAL → TASK CREATION → GENERAL), (3) Fitness Coach Protocol with real programming principles (compound-first, progressive overload, volume matching by goal), (4) Dietician Protocol with macro calculation rules (protein per lb, deficit/surplus ranges, cultural awareness), (5) Response Quality Standards enforcing context-awareness and cross-domain intelligence, (6) Preserved existing safety features (child mode, domain restriction, typography, no fake success).
- **New `generate_meal_plan` Tool**: Added a brand new structured tool for diet/meal plan generation with full schema: plan name, goal (cut/bulk/maintain/recomp), daily macros (calories/protein/carbs/fat), meals array (name, time, foods, per-meal macros), and coaching notes. This gives Ava a proper structured output path for nutrition coaching instead of misrouting to `add_task`.
- **`save_workout_template` Tool Ported**: Ported the complete `save_workout_template` tool definition from the old v2 route.ts to the modular `toolDefinitions.ts`, with enhanced trigger descriptions explicitly listing all workout-related request patterns.
- **`add_task` Tool Hardened**: Rewrote the `add_task` tool description to explicitly forbid use for workout/diet/coaching requests and redirect to `save_workout_template` or `generate_meal_plan` respectively.
- **COACHING Intent Added to Pipeline**: Added `COACHING` as a first-class intent type in `pipeline.ts`, positioned above `CREATION` in priority. The classifier now distinguishes between "make me a plan" (COACHING) and "add to my to-do list" (CREATION), preventing the fundamental misclassification that caused the bug.
- **Token Limit Fix**: Increased `maxOutputTokens` from 800 to 2500 in `route.ts`. The 800-token cap was physically preventing the LLM from producing proper coaching output (a 6-exercise workout template needs ~1500 tokens), biasing it toward short tool calls like `add_task`.
- **Meal Plan Client Handler**: Added `generate_meal_plan` function call handler in `GlobalAICopilot.tsx` that formats the structured meal plan as rich text with macro breakdowns per meal, daily targets, and coaching notes.

### August 16, 2026 — Full Backend Audit & Bug Fixes
Conducted a comprehensive audit of all API routes, LLM orchestration, data storage services, and providers. Found and fixed 7 bugs:
- **BUG FIX — Wrong Model Name**: `llm.ts` primary model was `gemini-3.1-flash-lite` (non-existent) → fixed to `gemini-2.5-flash-lite`. This was causing EVERY request to fail on the first provider and silently fall through to the more expensive Gemini 2.5 Flash.
- **BUG FIX — Token Defaults in Providers**: `GeminiProvider.ts` and `OpenAIProvider.ts` both had `maxOutputTokens: 800` as hardcoded defaults. These were being used when fallback models (OpenRouter/Llama) handled requests, causing truncated coaching responses on the fallback path. Fixed both to 1500.
- **BUG FIX — COACHING Missing From Schema**: `pipeline.ts` intent classifier schema description listed all intents EXCEPT `COACHING`. Some strict LLMs refuse to return values not in the schema description, meaning they'd never classify a request as COACHING. Fixed by adding `COACHING` to the description string.
- **BUG FIX — Inverted Deficit Math**: `dietStorage.ts` `getWeeklyDeficitAggregation()` had `totalDeficit += (net - tdeeGoal)` which gives negative numbers for people eating in deficit, then double-negated to get weight loss. Fixed formula to `dailyDeficit = tdeeGoal - net` (positive = losing weight) with no negation at the end.
- **BUG FIX — Image Data Stripped From History**: `route.ts` `mappedHistory` mapping only preserved `text`, dropping `imageUrl`. Multi-turn conversations referencing a previously uploaded image were completely broken. Fixed by including `imageUrl` via an IIFE that extracts `inlineData` from parts.
- **BUG FIX — Dead Code Fallback**: `route.ts` lines 241–271 built a Telugu fallback string but never returned it (missing `return NextResponse.json(...)`). Added the missing return statement.
- **BUG FIX — Cron RLS Bypass Broken**: `notifications.ts` `supabaseAdmin` falls back to the anon key if `SUPABASE_SERVICE_ROLE_KEY` is missing. Added a hard guard at the top of the cron route that returns 500 immediately instead of silently failing.
- **Remaining Known Issues (not yet fixed)**: Race condition in `saveMealsForDate` (delete+reinsert is not atomic), hardcoded placeholder user ID in orchestrator telemetry, AI memories not auto-refreshed in session after `save_ai_memory` tool call.

- **Workout Generation Chat Display (Aug 17)**: Overrode the original rulebook directive that forced the chat to close and navigate to /workout when a workout was generated. Modified GlobalAICopilot.tsx to automatically run WorkoutTemplateService.create in the background and format the validatedExercises into a rich markdown string directly injected into the conversation. Also updated AGENTS.md to reflect this new UX paradigm.

### August 16-17, 2026 - Phase 1-7 Gamification & Psychological Architecture
- **Phase 1-4 (Foundational UI)**: Established the core Apple-style visual language. Implemented Cinematic Dark Mode, Haptic Feedback hooks, deep `backdrop-blur-3xl` glassmorphism on modals and sidebars, and particle effects for high-level UI feedback.
- **Phase 5 (Gamification Roadmap)**: 
    - **Fluid Macro Rings**: Replaced static diet progress bars with massive, pill-shaped fluid capsules in `MacroRings.tsx` featuring an inner "sloshing liquid wave" effect.
    - **Forge Impact Logs**: Added `ForgeImpactOverlay.tsx` to the workout completion flow. Triggering "Finish" now dims the screen, flashes an anvil strike, and explodes physics-driven glass shards outwards.
    - **Ghost Mode PVP**: Added dual tracking bars (Current Pace vs Ghost Pace) in `ActiveSplitCard.tsx` to visualize workout speed.
    - **Ava Audio Waveform**: Integrated a dynamic, multi-colored Siri-style visualizer into `GlobalAICopilot.tsx` that bounces to the rhythm of Ava's text-to-speech output.
- **Phase 6 (Iron Man 3D Parallax HUD)**: 
    - Transformed `DailyBriefingModal.tsx` into a 3D hologram using `framer-motion` (`rotateX`, `rotateY`, `translateZ`). The modal now tracks pointer/touch movement to create a high-depth parallax effect (`perspective: 1200`).
    - Added Auto-Voice Initialization (TTS). Ava now reads the daily briefing aloud immediately on mount, parsing snapshot data (sleep, diet, workouts) and synthesizing a contextual Freudian greeting.
- **Phase 7 (Continuous Psychological Profiling Engine Backend)**:
    - Built a robust learning backend to eliminate Ava's session-to-session amnesia. 
    - Created DB Migration `20260817000000_user_psychology.sql` with a new `psychological_profiles` table (storing `freudian_analysis` and `dopamine_triggers`).
    - Added background endpoint `/api/ai/analyze-psychology` which takes the user's latest chat chunks, extracts deep psychological insights, and upserts them to the database.
- **Phase 8 (The God Mode Dashboard)**:
    - **Readiness Score Widget**: Built an Oura/Whoop style predictive analytics circular gauge (`ReadinessScoreWidget.tsx`). Calculates a 0-100 real-time score from sleep, hydration, and protein data, glowing green for Peak recovery and red for Depleted.
    - **Ghost Rival PvP**: Introduced an AI opponent named "Shadow" (`GhostRivalWidget.tsx`). The rival's XP and Streak are procedurally generated to always stay neck-and-neck with the user, creating eternal competitive urgency.
- **Phase 9 (The Apple Watch HUD)**:
    - **Sensory Expansion**: Created a dedicated `HudView.tsx` designed specifically for active gym sessions. It uses a `fixed inset-0 bg-black z-[9999]` portal to simulate an OLED smartwatch face, hiding all complex UI elements.
    - **Audio-Haptic Rest Timer**: Built `HudRestTimer.tsx` which leverages the Web Audio API to play a physical "DING" (800Hz-300Hz sine wave) and triggers `navigator.vibrate` when the massive text rest timer hits zero.
- **Phase 10 (The Shadow Enemy)**:
    - **Psychological AI Nemesis**: Evolved the Ghost Rival into an active AI persona named "Shadow". Built `/api/ai/shadow` which cross-references the user's `psychological_profiles` to generate cutthroat, domain-specific taunts.
    - **Pervasive UI Integration**: Built `ShadowTauntCard.tsx` (with typewriter effect and pulsing red aura) and injected it directly into the Dashboard (`GhostRivalWidget`), the Budget Tracker, and the Workout Page to trigger the user's competitive drive globally.
    - **Hotfix 1 (Syntax & Caching)**: Fixed a missing `</div>` tag in `GhostRivalWidget` that broke compilation. Updated `useShadowTaunt` to use a `v2` cache key to instantly bust corrupted strings.
    - **Hotfix 2 (LLM Defensive Parsing)**: Replaced `orchestrator.execute` with `orchestrator.generateContent`. Aggressively sanitized LLM outputs (`/^["'\s]+|["'\s]+$/g`) to prevent edge cases where leading spaces caused regex truncation of the first letter. Refactored the UI typewriter effect to use deterministic `slice()` instead of `prev + char` to prevent React 18 Strict Mode double-invocation duplication.
    - **Phase 10 Reboot (Shadow War Room)**: Scrapped the disconnected XP bar + generic taunt approach entirely. Rebuilt as a cinematic War Room card showing Shadow's real last session vs the user's actual last session with data-driven intensity bars. Built `shadow_activity_log` DB table (mirrors user sessions with +8% volume boost). AI verdict is now 1 surgical sentence generated from real data diffs (actual volume, duration, weekly count), not generic prompts. Budget page shows real savings rate vs Shadow's. Workout page shows real weekly session count vs Shadow's.

### August 21, 2026 - Countdowns Date Logic Fix
- **Timezone and Fractional Dates Bug**: Fixed an issue where the `getDaysRemaining` logic in `CountdownsPage` and `DashboardCountdowns` was incorrectly parsing standard `"YYYY-MM-DD"` dates as UTC, then converting them to local time. This caused the day to shift backwards or forwards depending on the user's timezone. Combined with `Math.ceil()`, it caused inconsistent countdowns based on the exact time of day. 
- **Solution**: Refactored the calculation to safely split the date string (`YYYY`, `MM`, `DD`) and instantiate the target date explicitly at local midnight. The `today` reference was also explicitly set to local midnight, and the fractional ms difference is now correctly reduced to exact integer calendar days using `Math.round()`.
