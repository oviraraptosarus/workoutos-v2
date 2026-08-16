# Legal Hardening Action Plan

This document outlines the required engineering and product changes to make Workout OS legally compliant and defensively positioned, specifically addressing the high-risk surfaces of AI, Health Data, Financial Data, and Biometric Images.

## P0 — MUST FIX BEFORE PUBLIC LAUNCH (BLOCKERS)

### 1. Strict 18+ Age Gate Implementation
**Risk:** The current codebase lacks a strict DOB or ID-based age gate, relying instead on implicit assumptions.
**Required Change:** Implement a hard block during the Supabase Auth sign-up flow. Users must explicitly confirm they are 18 or older.
**Action:** Modify the onboarding UI to require a Date of Birth. Reject any DOB resulting in an age < 18. Store a boolean `is_over_18` and `age_verified_at` timestamp in the `profiles` table.

### 2. Nudity / NSFW Detection for Progress Photos
**Risk:** Users uploading progress photos could upload CSAM or explicit imagery, creating severe platform liability and violating Supabase storage terms.
**Required Change:** Prevent explicit imagery from being permanently stored or processed.
**Action:** Integrate a lightweight NSFW detection API (e.g., Google Cloud Vision SafeSearch or an edge-based TensorFlow.js model) *before* the image is committed to the Supabase `progress_photos` bucket. Reject uploads flagged as explicit.

### 3. Explicit AI Processing Consent & Zero-Retention Configuration
**Risk:** Sending unstructured PII (voice transcripts, chat messages, images) to Google/OpenRouter without explicit opt-in violates the DPDP Act.
**Required Change:** 
1. Add an explicit, un-pre-ticked checkbox during onboarding: *"I consent to my voice, text, and image inputs being processed by third-party AI providers to power the Copilot."*
2. **Codebase Audit Required:** Ensure the `@google/genai` and OpenRouter API calls are explicitly configured for **zero data retention** (e.g., passing specific headers to OpenRouter to prevent training on user inputs). If the providers do not guarantee zero retention, this must be stated in the Privacy Policy.

### 4. Hardcoded AI Prompt Guardrails (Health & Medical)
**Risk:** The AI autonomously advising users on diet or injury rehab constitutes unauthorized medical advice.
**Required Change:** Update `src/app/api/ai/chat/route.ts` system prompt.
**Action:** Add strict prompt rules: *"If the user asks for injury rehabilitation, medical diagnosis, or psychological counseling, immediately refuse and state you are an execution tracker, not a doctor."*

### 5. Granular Data Export & Account Deletion
**Risk:** DPDP Act and GDPR require the right to erasure and portability.
**Required Change:** Add "Download My Data" and "Delete Account" buttons.
**Action:** The deletion button must trigger a Supabase RPC function that cascades deletes across all tables (`profiles`, `daily_logs`, `tasks`, `progress_photos`, `ai_memories`) and purges the Storage bucket.

## P1 — SHOULD FIX BEFORE PUBLIC LAUNCH

### 1. Deprecate Unnecessary Medical Tables (Data Minimization)
**Risk:** The SQL schema contains `bloodwork_entries`, `injury_logs`, and `medication_logs`. 
**Required Change:** Unless this app intends to become a regulated health entity, **do not collect this data**.
**Action:** Drop these tables. Storing actual medical records exponentially increases liability and security requirements. 

### 2. RLS (Row Level Security) Verification
**Risk:** Data leakage across users.
**Required Change:** Verify that `ai_memories`, `task_execution_scores`, and `behavior_patterns` have strict `(auth.uid() = user_id)` policies. 
**Action:** Run a security audit script against the Supabase schema to ensure no tables are missing RLS.

## P2 — IMPORTANT POST-LAUNCH

### 1. Telemetry Log Anonymization
**Risk:** `telemetry_logs` may inadvertently log PII or raw user prompts during crashes.
**Required Change:** Implement a scrubbing function before inserting into `telemetry_logs`.
**Action:** Strip UUIDs, Names, and raw chat text from error stack traces.

### 2. Commercial / Subscription Readiness
**Risk:** Consumer protection laws regarding subscriptions.
**Required Change:** Once Stripe is added, implement a 1-click cancellation button. Do not require users to email support to cancel.
