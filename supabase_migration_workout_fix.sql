-- ============================================================================
-- Workout OS - Workout Logging Refactor Migration
-- ============================================================================
-- Adds top-level columns to workout_logs to prevent burying critical data in JSON.
-- Adds burn goals to profiles.
-- ============================================================================

-- 1. Alter workout_logs
ALTER TABLE public.workout_logs
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS calories_burned INTEGER,
ADD COLUMN IF NOT EXISTS intensity TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS custom_name TEXT;

-- 2. Alter profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_burn_goal INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS weekly_burn_goal INTEGER DEFAULT 3500,
ADD COLUMN IF NOT EXISTS monthly_burn_goal INTEGER DEFAULT 15000,
ADD COLUMN IF NOT EXISTS workout_preferences JSONB DEFAULT '{}'::jsonb;

-- Optional: Re-run schema cache flush if necessary for Supabase PostgREST
NOTIFY pgrst, 'reload schema';
