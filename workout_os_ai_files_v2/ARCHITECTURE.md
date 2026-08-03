# Workout OS Architecture

Version: 1.0  
Status: Source of Truth

## Purpose
Define how Workout OS is built so every AI and developer follows the same system.

## Stack
- Frontend: Next.js, React, TypeScript
- Backend: Supabase
- Database: PostgreSQL
- Auth: Supabase Auth
- Storage: Supabase Storage
- AI: AVA with Gemini primary and OpenRouter fallback

## Core Rules
- One source of truth per domain.
- No duplicate clients, services, hooks, contexts, or API routes.
- Supabase is the source of truth for persisted data.
- Do not mix localStorage and Supabase for the same data.
- Reuse existing code whenever possible.

## Data Flow
UI → Hook/Context → Service/API → Supabase → Response → UI refresh

## Main Domains
- Auth
- Profile
- Dashboard
- Diet
- Workout
- Planner
- Budget
- Progress Photos
- AI / AVA
- Storage
- Settings

## Backend Requirements
- Every user-owned record must be tied to auth.uid().
- Every table needs proper RLS.
- Every upload bucket needs matching storage policies.
- Any changed schema must match the current frontend.

## AI Requirements
- AI requests must go through the orchestrator.
- Do not call providers directly from the frontend.
- AI output must follow the app language rules.

## Before Changing Code
1. Find the related files.
2. Trace the complete flow.
3. Identify the source of truth.
4. Identify duplicates or stale paths.
5. Explain the fix.
6. Then implement.

## Verification
After changes:
- TypeScript
- lint
- build
- runtime check
- persistence check
- regression check
