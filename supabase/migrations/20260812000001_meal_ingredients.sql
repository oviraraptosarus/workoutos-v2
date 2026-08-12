-- Add ingredients and icon columns to meal_entries table
ALTER TABLE public.meal_entries ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.meal_entries ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🍽️';

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
