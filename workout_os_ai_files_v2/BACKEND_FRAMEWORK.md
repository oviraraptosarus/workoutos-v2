# Backend Framework

## Purpose
Keep backend logic consistent, testable, and traceable.

## Rules
- One source of truth per feature.
- Extend existing services when possible.
- Do not create duplicate routes or helpers.
- Keep request and response shapes stable.
- Validate every write against the current schema.
- Log and surface real backend errors.

## Required Flow
UI → state → service/API → backend → database/storage → response → UI refresh

## Common Failure Points
- stale schema
- wrong column name
- missing RLS
- old API route
- local cache not syncing
- missing storage policy
- duplicate Supabase clients

## Verification
After backend work:
- test write path
- test read path
- test delete path
- test auth ownership
- test build
