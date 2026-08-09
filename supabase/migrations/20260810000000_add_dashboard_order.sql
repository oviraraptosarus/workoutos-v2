-- Adds the dashboard_order JSONB column to the profiles table
-- Default order corresponds to the standard widgets available on the dashboard.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dashboard_order JSONB DEFAULT '["bento", "touch_grass", "weight_log", "time_progress", "quick_notes", "tasks", "countdowns"]'::jsonb;
