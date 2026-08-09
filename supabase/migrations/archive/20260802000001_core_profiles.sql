-- Migration: Core Profiles and Functions
-- File: supabase/migrations/20260802000001_core_profiles.sql

-- Helper Trigger Function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   BEGIN
      NEW.updated_at = now();
   EXCEPTION WHEN OTHERS THEN
      -- Gracefully ignore if the underlying table lacks an updated_at column
      NULL;
   END;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  username text UNIQUE,
  avatar_path text,
  dob date,
  height_cm numeric,
  current_weight numeric,
  target_weight numeric,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  fitness_goal text,
  water_goal_ml integer DEFAULT 3000,
  calorie_goal integer DEFAULT 2200,
  sleep_goal numeric DEFAULT 8,
  monthly_budget numeric DEFAULT 1000,
  monthly_income numeric DEFAULT 2000,
  enable_financial_reminders boolean DEFAULT true,
  currency text DEFAULT 'INR',
  
  -- Stats & Gamification
  level integer DEFAULT 1,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,

  -- Preferences & Settings
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  units text NOT NULL DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  preferred_language text DEFAULT 'en',
  preferred_ai_voice text,
  voice_enabled boolean DEFAULT true,
  notifications_enabled boolean DEFAULT true,
  ai_memory_enabled boolean DEFAULT true,

  notification_prefs jsonb DEFAULT '{}'::jsonb,
  appearance_prefs jsonb DEFAULT '{"dark_mode": "false", "text_scale": 1.0}'::jsonb,
  on_appetite_affecting_medication boolean DEFAULT false,
  tracks_menstrual_cycle boolean DEFAULT false,
  target_config jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Username Helper Functions
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
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
