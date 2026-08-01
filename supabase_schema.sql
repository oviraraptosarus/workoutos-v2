-- Workout OS Companion App Supabase Schema
-- Run this in your Supabase SQL Editor

-- 1. Extend user_profiles (assuming auth.users exists)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  username text UNIQUE,
  dob date,
  height_cm numeric,
  current_weight numeric,
  target_weight numeric,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  fitness_goal text,
  water_goal_ml integer,
  calorie_goal integer,
  sleep_goal numeric,
  monthly_budget numeric,
  monthly_income numeric,
  enable_financial_reminders boolean DEFAULT true,
  currency text DEFAULT 'INR',
  notification_prefs jsonb DEFAULT '{}'::jsonb,
  appearance_prefs jsonb DEFAULT '{"dark_mode": "false", "text_scale": 1.0}'::jsonb,
  on_appetite_affecting_medication boolean DEFAULT false,
  tracks_menstrual_cycle boolean DEFAULT false,
  target_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RPC Functions for Username Handling
CREATE OR REPLACE FUNCTION check_username_available(p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username);
END;
$$;

CREATE OR REPLACE FUNCTION get_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM public.profiles WHERE username = p_username;
  RETURN v_email;
END;
$$;

-- 2. Daily Logs (Water, Sleep, etc)
CREATE TABLE public.daily_logs (
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
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own daily_logs" ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily_logs" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily_logs" ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily_logs" ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);

-- 3. Meal Entries
CREATE TABLE public.meal_entries (
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
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own meal_entries" ON public.meal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal_entries" ON public.meal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal_entries" ON public.meal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal_entries" ON public.meal_entries FOR DELETE USING (auth.uid() = user_id);

-- 4. Expenses (Budget Tracker)
CREATE TABLE public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  quantity integer DEFAULT 1,
  protein_g numeric,
  transaction_type text CHECK (transaction_type IN ('income', 'expense')) DEFAULT 'expense',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- 5. Workout Logs
CREATE TABLE public.workout_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  session_type text NOT NULL,
  exercises jsonb DEFAULT '[]'::jsonb,
  is_outdoor boolean DEFAULT false,
  posture_work_done boolean DEFAULT false,
  completed boolean DEFAULT false,
  skipped_reason text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own workout_logs" ON public.workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout_logs" ON public.workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout_logs" ON public.workout_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout_logs" ON public.workout_logs FOR DELETE USING (auth.uid() = user_id);

-- 6. Bloodwork Entries
CREATE TABLE public.bloodwork_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  testosterone_ng_dl numeric,
  estrogen_pg_ml numeric,
  cholesterol_ldl numeric,
  cholesterol_hdl numeric,
  iron_ug_dl numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.bloodwork_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bloodwork_entries" ON public.bloodwork_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bloodwork_entries" ON public.bloodwork_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bloodwork_entries" ON public.bloodwork_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bloodwork_entries" ON public.bloodwork_entries FOR DELETE USING (auth.uid() = user_id);

-- 7. Injury Logs
CREATE TABLE public.injury_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  body_part text NOT NULL,
  severity integer CHECK (severity BETWEEN 1 AND 10),
  notes text,
  recovered boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.injury_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own injury_logs" ON public.injury_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own injury_logs" ON public.injury_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own injury_logs" ON public.injury_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own injury_logs" ON public.injury_logs FOR DELETE USING (auth.uid() = user_id);

-- 8. Medication Logs
CREATE TABLE public.medication_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  medication_name text NOT NULL,
  dosage text,
  time_taken time,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own medication_logs" ON public.medication_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medication_logs" ON public.medication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medication_logs" ON public.medication_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medication_logs" ON public.medication_logs FOR DELETE USING (auth.uid() = user_id);

-- 9. Milestones
CREATE TABLE public.milestones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own milestones" ON public.milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own milestones" ON public.milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own milestones" ON public.milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own milestones" ON public.milestones FOR DELETE USING (auth.uid() = user_id);

-- 10. App State
CREATE TABLE public.app_state (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  last_sync timestamp with time zone DEFAULT now(),
  offline_queue jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own app_state" ON public.app_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own app_state" ON public.app_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own app_state" ON public.app_state FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own app_state" ON public.app_state FOR DELETE USING (auth.uid() = user_id);

-- 11. Tasks (Planner)
CREATE TABLE public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  title text NOT NULL,
  description text,
  due_date text,
  subtasks jsonb DEFAULT '[]'::jsonb,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);
