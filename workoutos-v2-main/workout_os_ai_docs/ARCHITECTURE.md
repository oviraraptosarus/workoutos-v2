# Workout OS Architecture

Version: 1.0
Status: Single Source of Truth

---

## Purpose

This document defines the architecture of Workout OS.

Any AI agent working on this project should read this file before making code changes.

Do not create duplicate implementations.
Do not replace existing architecture.
Always extend the existing system.

---

## Tech Stack

Frontend
- Next.js
- React
- TypeScript

Backend
- Supabase

Database
- PostgreSQL

Authentication
- Supabase Auth

Storage
- Supabase Storage

AI
- AVA
- Gemini
- OpenRouter fallback

---

## Design Principles

- Single source of truth
- No duplicate services
- No duplicate API routes
- No duplicate Supabase clients
- No duplicate contexts
- No duplicate storage helpers
- No duplicate auth flows
- No duplicate database helpers
- Reuse existing implementations
- Prefer the smallest possible fix

---

## Application Layers

UI
↓

Hooks
↓

Contexts
↓

Services
↓

API Routes / Server Actions
↓

Supabase
↓

Database
↓

Response
↓

React State
↓

UI

Do not bypass this architecture unless explicitly documented.

---

## Supabase

Single Supabase client only.

Recommended location:
- `src/lib/supabase`

Do not create additional clients.

---

## Authentication

Source of truth:
- Supabase Auth

Flow:
- Sign In
→ Supabase Auth
→ Profile Fetch
→ Context Update
→ UI

---

## User Profile

Source of truth:
- `profiles` table

Contains:
- name
- username
- avatar
- theme
- units
- language
- AI settings
- notifications
- fitness settings

Never store profile data in localStorage.

---

## Theme

Source of truth:
- `profiles.theme`

Fallback:
- `system`

Supported:
- `light`
- `dark`
- `system`

---

## Dashboard

Owner:
- Dashboard module

Depends on:
- `profiles`
- `daily_logs`
- `progress_photos`
- `workout_logs`
- `meal_entries`

Never use mock data.

---

## Weight Tracking

Source:
- `daily_logs`

Flow:
Weight Card
→ Weight Service
→ Supabase
→ `daily_logs`
→ Dashboard refresh

---

## Progress Photos

Source:
- `progress_photos`

Storage:
- `progress_photos` bucket

Flow:
Upload
→ Storage
→ Database insert
→ Gallery refresh

Every uploaded image must have:
- `user_id`
- `storage_path`
- `uploaded_at`

Never create another progress photo implementation.

---

## Workout

Tables:
- `workout_logs`
- `exercise_logs`

Flow:
Workout Screen
→ Workout Service
→ Supabase
→ History
→ Dashboard

---

## Diet

Tables:
- `meal_entries`
- `daily_logs`
- `food_scans`

Flow:
Meal Entry
→ Supabase
→ Macro calculation
→ Dashboard

---

## Water Tracking

Table:
- `daily_logs`

Never store water locally.

---

## Planner

Tables:
- `tasks`
- `habits`
- `calendar_events`

Everything syncs with Supabase.

---

## Budget

Table:
- `expenses`

No localStorage.

---

## AI (AVA)

Entry:
- `/api/ai/chat`

Architecture:
Frontend
→ API
→ LLM Orchestrator
→ Gemini
→ OpenRouter fallback

Conversation history should be stored in Supabase.

Never call providers directly from the frontend.

---

## AI Memory

Tables:
- `ai_conversations`
- `ai_messages`

All conversations stored in Supabase.

---

## Barcode Scanner

Input:
- Camera

Flow:
Barcode Scan
→ Barcode Service
→ Nutrition Lookup
→ Meal Entry

---

## Storage Buckets

- `avatars`
- `progress_photos`

Future buckets must be documented here.

---

## API Rules

- One endpoint per feature
- Never duplicate endpoints
- Reuse existing routes

---

## State Management

Priority:
Supabase
→ Context
→ React State
→ UI

Never use localStorage as the source of truth.

---

## Before Writing Code

An AI agent must:

1. Read this document.
2. Find the existing implementation.
3. Trace the data flow.
4. Identify the source of truth.
5. Reuse existing services.
6. Explain the repair plan.
7. Only then modify code.

---

## Never Do

- Create duplicate API routes
- Create duplicate Supabase clients
- Create duplicate contexts
- Create duplicate storage helpers
- Create duplicate auth systems
- Create duplicate services
- Create duplicate schemas
- Create mock data when backend exists
- Replace working architecture

---

## Always Do

- Extend existing implementation
- Maintain one source of truth
- Keep frontend and backend synchronized
- Preserve Supabase schema
- Preserve API contracts
- Preserve routing

---

## Final Validation

After every backend change:
- Run TypeScript
- Run lint
- Run build

Verify:
- Database writes
- Database reads
- Storage uploads
- Storage downloads
- Authentication
- UI refresh

Only then consider the task complete.
