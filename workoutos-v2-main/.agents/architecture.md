# Workout OS: Architecture & Blueprint

This document is the definitive technical blueprint for Workout OS. **Read this file before implementing new features or debugging complex bugs.** 

## 1. Core Architecture Principles
- **Source of Truth:** Supabase is the single source of truth. Do NOT rely on `localStorage` or detached React state for anything that should persist.
- **Data Flow:** UI -> React State -> Supabase Client (or Next.js API Route) -> Database/Storage -> Response -> UI Refresh. 
- **Non-Destructive Changes:** Never drop columns or delete existing components without explicit permission. Additively extend schemas.

## 2. Feature Implementation Guides

### Content Vault (`/vault`)
- **Purpose:** A centralized hub to save and consume videos, articles, and content links.
- **Backend:** Uses the `content_vault` table (requires `url`, `title`, `description`, `thumbnail_url`, `content_type`, `status`). 
- **UI Architecture:** 
  - Accessed via the VaultWidget on the dashboard or directly via `/vault` page.
  - When saving, ping `/api/metadata?url=...` to scrape title/image before inserting into Supabase.

### Reflect Hub (End of Day Review)
- **Location:** Integrated into the dashboard's `planner/page.tsx` on the "Reflect" tab.
- **Voice-to-Text Logic (CRITICAL):** 
  - Uses native `SpeechRecognition` API.
  - MUST use the Platform-Aware State Machine. Desktop Chrome and iOS Safari use the standard W3C `resultIndex` loop. Android Chrome REQUIRES an `isAndroid` branch that exclusively extracts the last array item (`e.results[e.results.length - 1][0].transcript`) and DOES NOT auto-restart on `onend`, to prevent catastrophic audio-buffer replays and index duplication.
- **Backend:** Saves into the `daily_logs` table (upserting via `user_id, date`). Requires `raw_transcript` (Text) and `reflection` (Text). The LLM orchestrator parses the raw transcript into a structured reflection.

### Brain Dump
- **Location:** Integrated into the dashboard's `planner/page.tsx` on the "Brain" tab.
- **Workflow:**
  1. User speaks/types raw unstructured thoughts.
  2. UI calls `/api/ai/brain-dump` with the raw text.
  3. LLM returns a structured JSON array of discrete tasks.
  4. User is presented with a checklist to review/approve the extracted tasks.
  5. Approved tasks are saved to the `tasks` table.

## 3. UI/UX & Design System
- **Apple iOS Premium Design:** Clean, spaced-out formatting. Do not cram elements.
- **Glassmorphism:** Use `glass-card-premium` classes. Widget headers must float outside the glass backgrounds.
- **Color Palettes:** Do not hardcode generic colors. Rely on theme variables (e.g., `bg-blue-500` for primary action buttons).
- **Date Navigation:** Use sleek, native pill-styled date pickers. Do NOT add redundant `<` or `>` arrow buttons next to global date pickers.
- **Dashboard Interaction:** All dashboard widgets must act as hyperlinks (or have hyperlinked headers) routing to their respective full-page sections.

## 4. Multi-Provider AI Orchestrator
- The app uses a cascading AI provider strategy to prevent rate-limiting.
- **Flow:** Local Keys -> OpenRouter fallback.
- **Implementation:** Always use the existing AI orchestrator (`src/lib/llm-orchestrator/Orchestrator.ts`). **Do not hardcode API keys or standalone API calls in frontend components.** Ensure anti-hallucination prompts (Factual Grounding, Task Adherence) are included in all system instructions.
