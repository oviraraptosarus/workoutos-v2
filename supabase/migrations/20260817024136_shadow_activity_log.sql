-- Migration: Shadow Activity Log
-- Shadow mirrors the user's workout_logs with a slight performance boost.
-- Rows are auto-generated server-side when user logs a workout, or synthesized for skipped days.

CREATE TABLE IF NOT EXISTS public.shadow_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    session_type TEXT NOT NULL DEFAULT 'Training',
    custom_name TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    calories_burned INTEGER NOT NULL DEFAULT 0,
    total_volume_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
    intensity TEXT NOT NULL DEFAULT 'High',
    is_synthesized BOOLEAN NOT NULL DEFAULT false, -- true = shadow logged while user skipped
    source_workout_id UUID, -- references the original workout_logs row if mirrored
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS shadow_activity_log_user_date_idx ON public.shadow_activity_log (user_id, date DESC);

-- RLS
ALTER TABLE public.shadow_activity_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can read their own shadow log" ON public.shadow_activity_log FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can insert shadow log" ON public.shadow_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own shadow log" ON public.shadow_activity_log FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

NOTIFY pgrst, 'reload schema';
