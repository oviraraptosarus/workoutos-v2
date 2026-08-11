# Workout OS: Development Memory

> **Note:** This file serves strictly as a chronological changelog for major structural, UI, and backend changes. For core rules and architecture patterns, refer to `.agents/AGENTS.md` and `.agents/architecture.md`.

## Recent Milestones & Changes

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
