-- Workout OS Companion App - Complete Consolidated Supabase Schema
-- This script contains all tables, indexes, triggers, RLS policies, and functions.
-- It is completely idempotent and safe to run on existing databases.

-------------------------------------------------------------------------------
-- 0. TRIGGER FUNCTION
-------------------------------------------------------------------------------
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

-------------------------------------------------------------------------------
-- 1. PROFILES
-------------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Username RPC Helpers
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_email text;
BEGIN
  SELECT email INTO v_email FROM public.profiles WHERE username = p_username;
  RETURN v_email;
END;
$$;

-------------------------------------------------------------------------------
-- 2. DAILY LOGS & DIET & BUDGET
-------------------------------------------------------------------------------
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
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON public.daily_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own daily_logs" ON public.daily_logs;
CREATE POLICY "Users can view own daily_logs" ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own daily_logs" ON public.daily_logs;
CREATE POLICY "Users can insert own daily_logs" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own daily_logs" ON public.daily_logs;
CREATE POLICY "Users can update own daily_logs" ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own daily_logs" ON public.daily_logs;
CREATE POLICY "Users can delete own daily_logs" ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);

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
CREATE TRIGGER update_meal_entries_updated_at BEFORE UPDATE ON public.meal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own meal_entries" ON public.meal_entries;
CREATE POLICY "Users can view own meal_entries" ON public.meal_entries FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own meal_entries" ON public.meal_entries;
CREATE POLICY "Users can insert own meal_entries" ON public.meal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own meal_entries" ON public.meal_entries;
CREATE POLICY "Users can update own meal_entries" ON public.meal_entries FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own meal_entries" ON public.meal_entries;
CREATE POLICY "Users can delete own meal_entries" ON public.meal_entries FOR DELETE USING (auth.uid() = user_id);

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
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

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
CREATE TRIGGER update_workout_logs_updated_at BEFORE UPDATE ON public.workout_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own workout_logs" ON public.workout_logs;
CREATE POLICY "Users can view own workout_logs" ON public.workout_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own workout_logs" ON public.workout_logs;
CREATE POLICY "Users can insert own workout_logs" ON public.workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own workout_logs" ON public.workout_logs;
CREATE POLICY "Users can update own workout_logs" ON public.workout_logs FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own workout_logs" ON public.workout_logs;
CREATE POLICY "Users can delete own workout_logs" ON public.workout_logs FOR DELETE USING (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 3. HEALTH & PLANNER
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bloodwork_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  testosterone_ng_dl numeric,
  estrogen_pg_ml numeric,
  cholesterol_ldl numeric,
  cholesterol_hdl numeric,
  iron_ug_dl numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_bloodwork_entries_updated_at ON public.bloodwork_entries;
CREATE TRIGGER update_bloodwork_entries_updated_at BEFORE UPDATE ON public.bloodwork_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.bloodwork_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own bloodwork_entries" ON public.bloodwork_entries;
CREATE POLICY "Users can view own bloodwork_entries" ON public.bloodwork_entries FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own bloodwork_entries" ON public.bloodwork_entries;
CREATE POLICY "Users can insert own bloodwork_entries" ON public.bloodwork_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own bloodwork_entries" ON public.bloodwork_entries;
CREATE POLICY "Users can update own bloodwork_entries" ON public.bloodwork_entries FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own bloodwork_entries" ON public.bloodwork_entries;
CREATE POLICY "Users can delete own bloodwork_entries" ON public.bloodwork_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.injury_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  body_part text NOT NULL,
  severity integer CHECK (severity BETWEEN 1 AND 10),
  notes text,
  recovered boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_injury_logs_updated_at ON public.injury_logs;
CREATE TRIGGER update_injury_logs_updated_at BEFORE UPDATE ON public.injury_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.injury_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own injury_logs" ON public.injury_logs;
CREATE POLICY "Users can view own injury_logs" ON public.injury_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own injury_logs" ON public.injury_logs;
CREATE POLICY "Users can insert own injury_logs" ON public.injury_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own injury_logs" ON public.injury_logs;
CREATE POLICY "Users can update own injury_logs" ON public.injury_logs FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own injury_logs" ON public.injury_logs;
CREATE POLICY "Users can delete own injury_logs" ON public.injury_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.medication_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  medication_name text NOT NULL,
  dosage text,
  time_taken time,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_medication_logs_updated_at ON public.medication_logs;
CREATE TRIGGER update_medication_logs_updated_at BEFORE UPDATE ON public.medication_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own medication_logs" ON public.medication_logs;
CREATE POLICY "Users can view own medication_logs" ON public.medication_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own medication_logs" ON public.medication_logs;
CREATE POLICY "Users can insert own medication_logs" ON public.medication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own medication_logs" ON public.medication_logs;
CREATE POLICY "Users can update own medication_logs" ON public.medication_logs FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own medication_logs" ON public.medication_logs;
CREATE POLICY "Users can delete own medication_logs" ON public.medication_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_milestones_updated_at ON public.milestones;
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own milestones" ON public.milestones;
CREATE POLICY "Users can view own milestones" ON public.milestones FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own milestones" ON public.milestones;
CREATE POLICY "Users can insert own milestones" ON public.milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own milestones" ON public.milestones;
CREATE POLICY "Users can update own milestones" ON public.milestones FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own milestones" ON public.milestones;
CREATE POLICY "Users can delete own milestones" ON public.milestones FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  title text NOT NULL,
  description text,
  due_date text,
  subtasks jsonb DEFAULT '[]'::jsonb,
  completed boolean DEFAULT false,
  priority text CHECK (priority IN ('high', 'medium', 'low', 'none')) DEFAULT 'none',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.app_state (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  last_sync timestamp with time zone DEFAULT now(),
  offline_queue jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_app_state_updated_at ON public.app_state;
CREATE TRIGGER update_app_state_updated_at BEFORE UPDATE ON public.app_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own app_state" ON public.app_state;
CREATE POLICY "Users can view own app_state" ON public.app_state FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own app_state" ON public.app_state;
CREATE POLICY "Users can insert own app_state" ON public.app_state FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own app_state" ON public.app_state;
CREATE POLICY "Users can update own app_state" ON public.app_state FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own app_state" ON public.app_state;
CREATE POLICY "Users can delete own app_state" ON public.app_state FOR DELETE USING (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 4. PROGRESS PHOTOS
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  taken_at timestamp with time zone,
  uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
  weight_snapshot numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_progress_photos_updated_at ON public.progress_photos;
CREATE TRIGGER update_progress_photos_updated_at BEFORE UPDATE ON public.progress_photos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_progress_photos_user_id ON public.progress_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_date ON public.progress_photos(user_id, uploaded_at DESC);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own progress_photos" ON public.progress_photos;
CREATE POLICY "Users can view own progress_photos" ON public.progress_photos FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own progress_photos" ON public.progress_photos;
CREATE POLICY "Users can insert own progress_photos" ON public.progress_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own progress_photos" ON public.progress_photos;
CREATE POLICY "Users can update own progress_photos" ON public.progress_photos FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own progress_photos" ON public.progress_photos;
CREATE POLICY "Users can delete own progress_photos" ON public.progress_photos FOR DELETE USING (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 5. AI CONVERSATIONS & MESSAGES
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ai_conversations" ON public.ai_conversations;
CREATE POLICY "Users can view own ai_conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own ai_conversations" ON public.ai_conversations;
CREATE POLICY "Users can insert own ai_conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own ai_conversations" ON public.ai_conversations;
CREATE POLICY "Users can update own ai_conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own ai_conversations" ON public.ai_conversations;
CREATE POLICY "Users can delete own ai_conversations" ON public.ai_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_id ON public.ai_messages(conversation_id);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ai_messages" ON public.ai_messages;
CREATE POLICY "Users can view own ai_messages" ON public.ai_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert own ai_messages" ON public.ai_messages;
CREATE POLICY "Users can insert own ai_messages" ON public.ai_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete own ai_messages" ON public.ai_messages;
CREATE POLICY "Users can delete own ai_messages" ON public.ai_messages FOR DELETE USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-------------------------------------------------------------------------------
-- 6. FOOD SCANS
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.food_scans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  barcode text,
  product_name text,
  image_url text,
  brand text,
  serving_size text,
  nutrition_json jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_food_scans_updated_at ON public.food_scans;
CREATE TRIGGER update_food_scans_updated_at BEFORE UPDATE ON public.food_scans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_food_scans_user_id ON public.food_scans(user_id);

ALTER TABLE public.food_scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own food_scans" ON public.food_scans;
CREATE POLICY "Users can view own food_scans" ON public.food_scans FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own food_scans" ON public.food_scans;
CREATE POLICY "Users can insert own food_scans" ON public.food_scans FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own food_scans" ON public.food_scans;
CREATE POLICY "Users can update own food_scans" ON public.food_scans FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own food_scans" ON public.food_scans;
CREATE POLICY "Users can delete own food_scans" ON public.food_scans FOR DELETE USING (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 7. STORAGE POLICIES
-------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload own progress_photos" ON storage.objects;
CREATE POLICY "Users can upload own progress_photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'progress_photos' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can view own progress_photos" ON storage.objects;
CREATE POLICY "Users can view own progress_photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'progress_photos' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can update own progress_photos" ON storage.objects;
CREATE POLICY "Users can update own progress_photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'progress_photos' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can delete own progress_photos" ON storage.objects;
CREATE POLICY "Users can delete own progress_photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'progress_photos' AND auth.uid() = (storage.foldername(name))[1]::uuid);

DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can view own avatars" ON storage.objects;
CREATE POLICY "Users can view own avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
