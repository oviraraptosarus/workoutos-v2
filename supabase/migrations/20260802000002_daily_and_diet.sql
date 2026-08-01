-- Migration: Daily Logs, Diet, Expenses & Workout Logs
-- File: supabase/migrations/20260802000002_daily_and_diet.sql

-- 1. Daily Logs
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  weight_kg numeric,
  waist_cm numeric,
  sleep_bedtime time,
  sleep_waketime time,
  sleep_hours numeric,
  sleep_logs jsonb DEFAULT '[]'::jsonb,
  water_ml_total integer DEFAULT 0,
  water_logs jsonb DEFAULT '[]'::jsonb,
  steps integer DEFAULT 0,
  energy_rating integer CHECK (energy_rating BETWEEN 1 AND 10),
  mood_rating integer CHECK (mood_rating BETWEEN 1 AND 10),
  hunger_rating integer CHECK (hunger_rating BETWEEN 1 AND 10),
  caffeine_mg integer DEFAULT 0,
  alcohol_units numeric DEFAULT 0,
  resting_hr_or_recovery_feel integer,
  screen_time_in_app_minutes integer DEFAULT 0,
  screen_time_phone_minutes integer,
  outdoor_time_minutes integer DEFAULT 0,
  cycle_day integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date)
);

DROP TRIGGER IF EXISTS update_daily_logs_updated_at ON public.daily_logs;
CREATE TRIGGER update_daily_logs_updated_at
BEFORE UPDATE ON public.daily_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own daily_logs" ON public.daily_logs;
CREATE POLICY "Users can view own daily_logs" ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own daily_logs" ON public.daily_logs;
CREATE POLICY "Users can insert own daily_logs" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own daily_logs" ON public.daily_logs;
CREATE POLICY "Users can update own daily_logs" ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own daily_logs" ON public.daily_logs;
CREATE POLICY "Users can delete own daily_logs" ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);

-- 2. Meal Entries (Food Logs)
CREATE TABLE IF NOT EXISTS public.meal_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  meal_slot text NOT NULL,
  name text NOT NULL,
  calories integer DEFAULT 0,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  sugar numeric DEFAULT 0,
  fiber_g_estimate numeric DEFAULT 0,
  is_off_plan boolean DEFAULT false,
  off_plan_reason text CHECK (off_plan_reason IN ('stress', 'bored', 'social', 'unprepared', 'craving', 'other')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_meal_entries_updated_at ON public.meal_entries;
CREATE TRIGGER update_meal_entries_updated_at
BEFORE UPDATE ON public.meal_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own meal_entries" ON public.meal_entries;
CREATE POLICY "Users can view own meal_entries" ON public.meal_entries FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own meal_entries" ON public.meal_entries;
CREATE POLICY "Users can insert own meal_entries" ON public.meal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own meal_entries" ON public.meal_entries;
CREATE POLICY "Users can update own meal_entries" ON public.meal_entries FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own meal_entries" ON public.meal_entries;
CREATE POLICY "Users can delete own meal_entries" ON public.meal_entries FOR DELETE USING (auth.uid() = user_id);

-- 3. Expenses (Budget Transactions)
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  quantity integer DEFAULT 1,
  protein_g numeric,
  transaction_type text CHECK (transaction_type IN ('income', 'expense')) DEFAULT 'expense',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- 4. Workout Logs
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  session_type text NOT NULL,
  exercises jsonb DEFAULT '[]'::jsonb,
  is_outdoor boolean DEFAULT false,
  posture_work_done boolean DEFAULT false,
  completed boolean DEFAULT false,
  skipped_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_workout_logs_updated_at ON public.workout_logs;
CREATE TRIGGER update_workout_logs_updated_at
BEFORE UPDATE ON public.workout_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own workout_logs" ON public.workout_logs;
CREATE POLICY "Users can view own workout_logs" ON public.workout_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own workout_logs" ON public.workout_logs;
CREATE POLICY "Users can insert own workout_logs" ON public.workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own workout_logs" ON public.workout_logs;
CREATE POLICY "Users can update own workout_logs" ON public.workout_logs FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own workout_logs" ON public.workout_logs;
CREATE POLICY "Users can delete own workout_logs" ON public.workout_logs FOR DELETE USING (auth.uid() = user_id);
