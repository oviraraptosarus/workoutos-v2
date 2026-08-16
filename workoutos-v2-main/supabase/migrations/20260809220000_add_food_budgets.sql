-- Adds the food_budgets JSONB column to the profiles table
-- Safely uses IF NOT EXISTS so it won't break if run multiple times.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS food_budgets JSONB DEFAULT '{}'::jsonb;
