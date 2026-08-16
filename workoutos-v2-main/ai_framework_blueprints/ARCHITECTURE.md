# System Architecture Blueprint

Version: 2.0 (Ultimate Scalable Stack)
Status: Source of Truth

## 1. System Philosophy
This architecture is designed to build a **Premium, Native-Feeling Web Application** with an embedded **Global AI Copilot**. The primary goals are zero-friction user execution, absolute data consistency, and visually stunning, fluid interactions.

## 2. Core Technology Stack
- **Frontend Framework**: Next.js (App Router), React, TypeScript.
- **Styling**: Tailwind CSS (strict use of Design Tokens, Glassmorphism, and Fluid layout variables).
- **Icons & Animation**: Lucide React (for lightweight SVG icons) and Tailwind native `animate-in` for micro-interactions.
- **Backend & Database**: Supabase (PostgreSQL, GoTrue Auth, Storage, Edge Functions).
- **AI Engine**: Node.js/Edge API routes handling Server-Side Orchestration (Google GenAI primary, OpenRouter fallbacks).

## 3. The 3-Tier Execution Layer

### Tier 1: The Presentation Layer (Frontend)
- **Component Architecture**: 
  - `UI Components`: Dumb, stateless visual components (Buttons, Inputs, Cards).
  - `Feature Components`: Stateful widgets that consume context (e.g., A Dashboard Widget).
  - `Layouts & Nav`: Global persistent shells (TopNav, BottomNav) containing application state triggers.
- **State Management**: React Context or Zustand for global UI state (Theme, Language, Active Modals). No heavy client-side caching—rely on SWR/React Query or server actions fetching direct from DB.

### Tier 2: The Logic & Orchestration Layer (API)
- **Backend-for-Frontend (BFF)**: Next.js API Routes handle secret keys, AI orchestration, and complex multi-table transactions that shouldn't live on the client.
- **The AI Copilot Pipeline**: 
  1. Client sends raw prompt + client-side state snapshot.
  2. Orchestrator fetches global user context from Database.
  3. LLM synthesizes response based on Context + System Instructions.
  4. Server safely parses LLM JSON outputs into immediate Database mutations.
  5. UI actively listens to database changes or forces a client refresh.

### Tier 3: The Persistence Layer (Database)
- **Single Source of Truth**: The database is the absolute source of truth. `localStorage` is NEVER used for critical user data, only for non-critical UI preferences.
- **Row Level Security (RLS)**: Every single table must have strict RLS policies bound to `auth.uid()`.
- **Relational Integrity**: Use foreign keys, cascading deletes, and strict column typing (e.g., Enums for statuses).

## 4. Development Workflow Rules
1. **Never Duplicate**: If a hook exists to fetch data, do not write a direct `supabase.from()` call in a component. Use the hook.
2. **Never Bypass RLS**: Do not use the `service_role` key unless executing a chron job or a strictly isolated server-side webhook that cannot act as a user.
3. **Fail Gracefully**: If a 3rd party API (like AI) fails, the core app functionality (CRUD operations) must continue to work flawlessly.
4. **Design First, Build Second**: Do not push functional code without it adhering to the strict UI/UX guidelines defined in the Frontend Framework.
