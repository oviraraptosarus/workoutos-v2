# WORKOUT OS: MASTER AI RULEBOOK

> **CRITICAL DIRECTIVE:** Before you write a single line of code, read this document carefully. This is your mental framework for building Workout OS.

## 1. Do Not Break What Works (The "Mental Sandbox")
Before modifying ANY file, you MUST execute a "Mental Sandbox" trace.
- **Trace the Data Flow:** Does it use a store? Does it fetch via `supabase.from()`?
- **Assess the Blast Radius:** Will changing this React state break the mobile layout? Will removing this prop break a dashboard widget?
- **Read `.agents/architecture.md`:** If you are touching the **Content Vault**, **End of Day Review**, **Brain Dump**, or **Voice-to-Text**, read the architecture blueprint first. DO NOT blindly overwrite complex, solved logic (like the `SpeechRecognition` concatenation flow).

## 2. Apple Design Philosophy & Strict iOS Guidelines
Workout OS is an intelligent operating system for personal performance. It must feel premium, calm, and fast.
- **Widgets & Layout:** Widget headers MUST float OUTSIDE the `glass-card-premium` background. Prioritize extreme, clean, spaced-out formatting over cramming elements together.
- **Colors:** Do NOT hardcode colors (e.g., `slate-900`, plain red). Use semantic tokens and native iOS blues (`#0a84ff`) for primary actions (e.g. `bg-blue-500`). Ensure components look flawless in BOTH Light and Dark modes.
- **Typography:** Restrained, tightly tracked, small but highly legible fonts.

## 3. UI/UX Interaction Rules
- **Dashboard as a Launchpad:** ALL dashboard widgets must act as hyperlinks (or contain hyperlinked wrappers) that route the user to their full-page sections (e.g., clicking the Sleep Trends widget routes to `/sleep`).
- **Date Navigation:** Use sleek, native date pickers styled as pills (hidden `<input type="date">`). NEVER include `<` or `>` arrow buttons next to global date pickers.
- **Chart Pagination:** For historical data charts (Sleep, Weight), include localized pagination controls (`<` and `>`) directly above the chart. Do NOT tie chart pagination exclusively to the global page date picker.
- **Settings Buttons:** "Customize Dashboard" or similar configuration buttons must go at the BOTTOM of the page, below all content, to preserve clean top headers.

## 4. Cutthroat Precision & Anti-Hallucination
- Verify exact schemas. Ensure 100% adherence to the user's prompt without introducing unsolicited fluff or placeholder UI.
- Do NOT guess ambiguous requirements; STOP and ask. Outputs must be concise, cutthroat, and precise.
- When generating AI output (e.g., saving a workout template), DO NOT just return "Done." Provide conversational confirmation and route the user to the relevant page (e.g., `/workout`) to preview it.

## 5. Backend & AI Architecture
- **Supabase Discipline:** All SQL changes MUST be written to a correctly timestamped file in `supabase/migrations/` (e.g., `YYYYMMDDHHMMSS_description.sql`). Ensure RLS policies are explicitly defined.
- **Multi-Provider Strategy:** NEVER hardcode a single LLM provider for core operations. Always use the cascading orchestrator (`src/lib/llm-orchestrator/Orchestrator.ts`).

## 6. Strict Memory Protocol
- You MUST automatically log all significant UI changes, bug fixes, and feature additions into `memory.md` at the end of every task or interaction, WITHOUT requiring a reminder from the user.
- **KEEP `memory.md` CLEAN:** It is a chronological changelog, NOT a dumping ground for generic rules (those belong here).
