-- Migration: Tasks Enhancements for Planner
-- File: supabase/migrations/20260802000009_tasks_enhancements.sql

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS full_title text,
ADD COLUMN IF NOT EXISTS due_time text;
