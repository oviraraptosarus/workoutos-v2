-- REPAIR PLAN P0: Fix Schema Drift

-- 1. Fix workout_logs missing columns
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS duration_minutes numeric,
  ADD COLUMN IF NOT EXISTS calories_burned numeric,
  ADD COLUMN IF NOT EXISTS intensity text,
  ADD COLUMN IF NOT EXISTS custom_name text;

-- 2. Fix tasks missing columns (priority is required by frontend dashboard)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS priority text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 3. Notify PostgREST to reload the schema cache so the API recognizes the new columns immediately
NOTIFY pgrst, 'reload schema';
