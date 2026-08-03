-- Workout OS Companion App - Complete Consolidated Supabase Schema
-- This is the single source of truth mapped strictly to the frontend implementation.
-- All nested arrays (exercises, sleep logs, water logs) are stored as JSONB to match React state.

-------------------------------------------------------------------------------
-- 0. CLEANUP & EXTENSIONS
-------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------------------------------------------------------------
-- 1. ENUMS (Safe Creation)
-------------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE public.gender_enum AS ENUM ('male', 'female', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.theme_enum AS ENUM ('light', 'dark', 'system'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.units_enum AS ENUM ('metric', 'imperial'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.task_priority AS ENUM ('high', 'medium', 'low', 'none'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.transaction_type AS ENUM ('income', 'expense'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.ai_role AS ENUM ('user', 'assistant', 'system'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-------------------------------------------------------------------------------
-- 2. CORE TRIGGERS & FUNCTIONS
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auth Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, username, 
    accepted_terms, accepted_privacy, terms_version, privacy_version, accepted_at
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', lower(split_part(NEW.email, '@', 1))),
    COALESCE((NEW.raw_user_meta_data->>'accepted_terms')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'accepted_privacy')::boolean, false),
    NEW.raw_user_meta_data->>'terms_version',
    NEW.raw_user_meta_data->>'privacy_version',
    (NEW.raw_user_meta_data->>'accepted_at')::timestamptz
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-------------------------------------------------------------------------------
-- 3. PROFILES & USER SETTINGS
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  username text UNIQUE,
  avatar_path text,
  dob date,
  gender public.gender_enum,
  height_cm numeric,
  current_weight numeric,
  target_weight numeric,
  fitness_goal text,
  water_goal_ml integer DEFAULT 3000,
  calorie_goal integer DEFAULT 2200,
  sleep_goal numeric DEFAULT 8,
  monthly_budget numeric DEFAULT 1000,
  monthly_income numeric DEFAULT 2000,
  currency text DEFAULT 'INR',
  enable_financial_reminders boolean DEFAULT true,
  
  -- Stats & Gamification
  level integer DEFAULT 1,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,

  -- UI / Settings
  theme public.theme_enum DEFAULT 'system' NOT NULL,
  units public.units_enum DEFAULT 'metric' NOT NULL,
  preferred_language text DEFAULT 'en',
  preferred_ai_voice text DEFAULT 'alloy',
  voice_enabled boolean DEFAULT false,
  notifications_enabled boolean DEFAULT true,
  ai_memory_enabled boolean DEFAULT true,
  
  -- JSON Configs (including Habits within target_config)
  notification_prefs jsonb DEFAULT '{}'::jsonb,
  appearance_prefs jsonb DEFAULT '{"dark_mode": "false", "text_scale": 1.0}'::jsonb,
  on_appetite_affecting_medication boolean DEFAULT false,
  tracks_menstrual_cycle boolean DEFAULT false,
  target_config jsonb DEFAULT '{}'::jsonb,
  
  -- New additions
  timezone text DEFAULT 'UTC',
  quiet_hours_start time,
  quiet_hours_end time,
  accepted_terms boolean DEFAULT false,
  accepted_privacy boolean DEFAULT false,
  accepted_at timestamp with time zone,
  terms_version text,
  privacy_version text,

  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migration to ensure new columns exist in case table was already created
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS quiet_hours_start time,
  ADD COLUMN IF NOT EXISTS quiet_hours_end time,
  ADD COLUMN IF NOT EXISTS accepted_terms boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_privacy boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS privacy_version text;

-- Apply Auth Trigger (only applies to auth.users if run by superuser, gracefully ignore otherwise if local testing allows)
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;

-------------------------------------------------------------------------------
-- 4. DAILY LOGS & HEALTH
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, date)
);
DROP TRIGGER IF EXISTS update_daily_logs_updated_at ON public.daily_logs;
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON public.daily_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-------------------------------------------------------------------------------
-- 5. WORKOUT TRACKER
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  session_type text NOT NULL,
  exercises jsonb DEFAULT '[]'::jsonb,
  is_outdoor boolean DEFAULT false,
  posture_work_done boolean DEFAULT false,
  completed boolean DEFAULT false,
  skipped_reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
DROP TRIGGER IF EXISTS update_workout_logs_updated_at ON public.workout_logs;
CREATE TRIGGER update_workout_logs_updated_at BEFORE UPDATE ON public.workout_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON public.workout_logs(user_id, date);

-------------------------------------------------------------------------------
-- 6. TASKS & PLANNER
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  title text NOT NULL,
  full_title text,
  description text,
  due_date text,
  due_time text,
  subtasks jsonb DEFAULT '[]'::jsonb,
  completed boolean DEFAULT false,
  priority public.task_priority DEFAULT 'none',
  status public.task_status DEFAULT 'pending',
  tags text[] DEFAULT '{}',
  reminder_time timestamp with time zone,
  notification_enabled boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_by_ai boolean DEFAULT false,
  source_image text,
  recurrence_rule text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, date);

-------------------------------------------------------------------------------
-- 7. DIET & MEALS
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meal_entries (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
  off_plan_reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
DROP TRIGGER IF EXISTS update_meal_entries_updated_at ON public.meal_entries;
CREATE TRIGGER update_meal_entries_updated_at BEFORE UPDATE ON public.meal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-------------------------------------------------------------------------------
-- 8. BUDGET TRACKER
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  quantity integer DEFAULT 1,
  protein_g numeric,
  transaction_type public.transaction_type DEFAULT 'expense',
  is_subscription boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-------------------------------------------------------------------------------
-- 9. MEDICAL & MILESTONES
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bloodwork_entries (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  testosterone_ng_dl numeric,
  estrogen_pg_ml numeric,
  cholesterol_ldl numeric,
  cholesterol_hdl numeric,
  iron_ug_dl numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
DROP TRIGGER IF EXISTS update_bloodwork_entries_updated_at ON public.bloodwork_entries;
CREATE TRIGGER update_bloodwork_entries_updated_at BEFORE UPDATE ON public.bloodwork_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.injury_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  body_part text NOT NULL,
  severity integer CHECK (severity BETWEEN 1 AND 10),
  notes text,
  recovered boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
DROP TRIGGER IF EXISTS update_injury_logs_updated_at ON public.injury_logs;
CREATE TRIGGER update_injury_logs_updated_at BEFORE UPDATE ON public.injury_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.medication_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  medication_name text NOT NULL,
  dosage text,
  time_taken time,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
DROP TRIGGER IF EXISTS update_medication_logs_updated_at ON public.medication_logs;
CREATE TRIGGER update_medication_logs_updated_at BEFORE UPDATE ON public.medication_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
DROP TRIGGER IF EXISTS update_milestones_updated_at ON public.milestones;
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-------------------------------------------------------------------------------
-- 10. AI, STORAGE & MISC
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  taken_at timestamp with time zone,
  uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
  weight_snapshot numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
DROP TRIGGER IF EXISTS update_progress_photos_updated_at ON public.progress_photos;
CREATE TRIGGER update_progress_photos_updated_at BEFORE UPDATE ON public.progress_photos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_id ON public.progress_photos(user_id);

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role public.ai_role NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_id ON public.ai_messages(conversation_id);

CREATE TABLE IF NOT EXISTS public.food_scans (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  barcode text,
  product_name text,
  image_url text,
  brand text,
  serving_size text,
  nutrition_json jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
DROP TRIGGER IF EXISTS update_food_scans_updated_at ON public.food_scans;
CREATE TRIGGER update_food_scans_updated_at BEFORE UPDATE ON public.food_scans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.app_state (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  last_sync timestamp with time zone DEFAULT now(),
  offline_queue jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
DROP TRIGGER IF EXISTS update_app_state_updated_at ON public.app_state;
CREATE TRIGGER update_app_state_updated_at BEFORE UPDATE ON public.app_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-------------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS)
-------------------------------------------------------------------------------
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        
        -- Delete existing policies
        EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON public.%I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON public.%I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON public.%I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON public.%I', tbl, tbl);
        
        -- Special casing for tables that reference user_id directly vs those that don't
        IF tbl = 'profiles' THEN
            EXECUTE format('CREATE POLICY "Users can view own %I" ON public.%I FOR SELECT USING (auth.uid() = id)', tbl, tbl);
            EXECUTE format('CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT WITH CHECK (auth.uid() = id)', tbl, tbl);
            EXECUTE format('CREATE POLICY "Users can update own %I" ON public.%I FOR UPDATE USING (auth.uid() = id)', tbl, tbl);
            EXECUTE format('CREATE POLICY "Users can delete own %I" ON public.%I FOR DELETE USING (auth.uid() = id)', tbl, tbl);
        ELSIF tbl = 'ai_messages' THEN
            EXECUTE format('CREATE POLICY "Users can view own %I" ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))', tbl, tbl);
            EXECUTE format('CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))', tbl, tbl);
            EXECUTE format('CREATE POLICY "Users can update own %I" ON public.%I FOR UPDATE USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))', tbl, tbl);
            EXECUTE format('CREATE POLICY "Users can delete own %I" ON public.%I FOR DELETE USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))', tbl, tbl);
        ELSE
            EXECUTE format('CREATE POLICY "Users can view own %I" ON public.%I FOR SELECT USING (auth.uid() = user_id)', tbl, tbl);
            EXECUTE format('CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl, tbl);
            EXECUTE format('CREATE POLICY "Users can update own %I" ON public.%I FOR UPDATE USING (auth.uid() = user_id)', tbl, tbl);
            EXECUTE format('CREATE POLICY "Users can delete own %I" ON public.%I FOR DELETE USING (auth.uid() = user_id)', tbl, tbl);
        END IF;
    END LOOP;
END $$;

-------------------------------------------------------------------------------
-- 12. STORAGE BUCKETS & POLICIES
-------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('progress_photos', 'progress_photos', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('future_uploads', 'future_uploads', false) ON CONFLICT (id) DO NOTHING;

-- Avatars
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can view own avatars" ON storage.objects;
CREATE POLICY "Users can view own avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Progress Photos
DROP POLICY IF EXISTS "Users can upload own progress_photos" ON storage.objects;
CREATE POLICY "Users can upload own progress_photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'progress_photos' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can view own progress_photos" ON storage.objects;
CREATE POLICY "Users can view own progress_photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'progress_photos' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can update own progress_photos" ON storage.objects;
CREATE POLICY "Users can update own progress_photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'progress_photos' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can delete own progress_photos" ON storage.objects;
CREATE POLICY "Users can delete own progress_photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'progress_photos' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Future Uploads (AI, OCR, etc)
DROP POLICY IF EXISTS "Users can upload own future_uploads" ON storage.objects;
CREATE POLICY "Users can upload own future_uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'future_uploads' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can view own future_uploads" ON storage.objects;
CREATE POLICY "Users can view own future_uploads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'future_uploads' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can update own future_uploads" ON storage.objects;
CREATE POLICY "Users can update own future_uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'future_uploads' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can delete own future_uploads" ON storage.objects;
CREATE POLICY "Users can delete own future_uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'future_uploads' AND auth.uid() = (storage.foldername(name))[1]::uuid);
