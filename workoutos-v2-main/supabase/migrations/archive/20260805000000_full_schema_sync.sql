-- ============================================================================
-- Workout OS - Single Canonical Schema (supabase_schema.sql)
-- ============================================================================
-- Source of Truth for the backend. Clean schema from scratch.
-- Includes all required tables, relations, constraints, triggers, and RLS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & HELPER FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. PROFILES & USER SETTINGS
-- ----------------------------------------------------------------------------
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
  
  -- Smart Fitness Engine
  activity_level text CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'athlete')),
  bmi numeric,
  bmr numeric,
  tdee numeric,
  protein_goal numeric,
  fat_goal numeric,
  carb_goal numeric,
  
  -- Gamification (Streaks are here)
  level integer DEFAULT 1,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,

  -- Terms and conditions
  accepted_terms boolean DEFAULT false,
  accepted_privacy boolean DEFAULT false,
  terms_version text,
  privacy_version text,
  accepted_at timestamptz,

  -- Preferences & Settings
  onboarding_completed boolean DEFAULT false,
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

-- Auto-create profile from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_path, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    false
  );
  
  -- Create dependent settings records automatically
  INSERT INTO public.notification_settings (user_id) VALUES (NEW.id);
  INSERT INTO public.ai_settings (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backend Fitness Engine
CREATE OR REPLACE FUNCTION public.calculate_fitness_metrics() 
RETURNS TRIGGER AS $$
DECLARE
  v_age integer;
  v_multiplier numeric;
  v_bmr numeric;
  v_tdee numeric;
  v_cal_goal numeric;
BEGIN
  -- We only compute if we have height, weight, and DOB/Age
  IF NEW.height_cm IS NOT NULL AND NEW.current_weight IS NOT NULL AND NEW.dob IS NOT NULL THEN
    
    -- BMI
    NEW.bmi := NEW.current_weight / ((NEW.height_cm / 100.0) ^ 2);
    
    -- Age calculation
    v_age := extract(year from age(current_date, NEW.dob));
    
    -- BMR (Mifflin-St Jeor)
    IF NEW.gender = 'female' THEN
      v_bmr := (10 * NEW.current_weight) + (6.25 * NEW.height_cm) - (5 * v_age) - 161;
    ELSE
      v_bmr := (10 * NEW.current_weight) + (6.25 * NEW.height_cm) - (5 * v_age) + 5;
    END IF;
    NEW.bmr := v_bmr;
    
    -- TDEE
    v_multiplier := CASE 
      WHEN NEW.activity_level = 'sedentary' THEN 1.2
      WHEN NEW.activity_level = 'light' THEN 1.375
      WHEN NEW.activity_level = 'moderate' THEN 1.55
      WHEN NEW.activity_level = 'active' THEN 1.725
      WHEN NEW.activity_level = 'athlete' THEN 1.9
      ELSE 1.2 -- default
    END;
    v_tdee := v_bmr * v_multiplier;
    NEW.tdee := v_tdee;
    
    -- Calorie Goal
    v_cal_goal := CASE
      WHEN NEW.fitness_goal ILIKE '%Fat%' OR NEW.fitness_goal ILIKE '%Lose%' THEN v_tdee - 500
      WHEN NEW.fitness_goal ILIKE '%Muscle%' OR NEW.fitness_goal ILIKE '%Gain%' THEN v_tdee + 300
      ELSE v_tdee -- Maintain
    END;
    NEW.calorie_goal := round(v_cal_goal);
    
    -- Macros
    IF NEW.target_weight IS NOT NULL THEN
      NEW.protein_goal := round(2.0 * NEW.target_weight);
    ELSE
      NEW.protein_goal := round(2.0 * NEW.current_weight);
    END IF;
    
    NEW.fat_goal := round((v_cal_goal * 0.25) / 9.0);
    
    -- Carbs (remaining calories)
    NEW.carb_goal := round((v_cal_goal - (NEW.protein_goal * 4) - (NEW.fat_goal * 9)) / 4.0);
    IF NEW.carb_goal < 0 THEN NEW.carb_goal := 0; END IF;
    
    -- Water
    NEW.water_goal_ml := round(NEW.current_weight * 35);
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_calculate_fitness_metrics ON public.profiles;
CREATE TRIGGER trigger_calculate_fitness_metrics
  BEFORE INSERT OR UPDATE OF current_weight, height_cm, dob, gender, activity_level, fitness_goal, target_weight
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_fitness_metrics();


-- Username Helpers
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_email text;
BEGIN
  SELECT email INTO v_email FROM public.profiles WHERE username = p_username;
  RETURN v_email;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. APP SETTINGS & USER PREFS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, key)
);
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  daily_reminder boolean DEFAULT true,
  water_reminder boolean DEFAULT true,
  meal_reminder boolean DEFAULT true,
  workout_reminder boolean DEFAULT true,
  planner_reminders boolean DEFAULT true,
  habit_reminders boolean DEFAULT true,
  budget_alerts boolean DEFAULT true,
  weekly_reports boolean DEFAULT true,
  ai_insights boolean DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  notification_sound boolean DEFAULT true,
  vibration_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON public.notification_settings;
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.command_center_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text CHECK (category IN ('Immediate Action', 'Reminder', 'Planner Deadline', 'Health Alert', 'Workout Alert', 'Diet Alert', 'Budget Alert', 'AI Insight', 'System Event')),
  priority text CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  icon text DEFAULT 'bell',
  source_module text,
  status text CHECK (status IN ('active', 'completed', 'dismissed', 'snoozed')) DEFAULT 'active',
  action_type text,
  due_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
DROP TRIGGER IF EXISTS update_command_center_items_updated_at ON public.command_center_items;
CREATE TRIGGER update_command_center_items_updated_at BEFORE UPDATE ON public.command_center_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. DAILY LOGS & HEALTH
-- ----------------------------------------------------------------------------
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
  reflection jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date)
);
DROP TRIGGER IF EXISTS update_daily_logs_updated_at ON public.daily_logs;
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON public.daily_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.water_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  amount_ml integer NOT NULL,
  time_logged timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. NUTRITION
-- ----------------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS public.macro_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  total_calories integer DEFAULT 0,
  total_protein numeric DEFAULT 0,
  total_carbs numeric DEFAULT 0,
  total_fat numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date)
);
DROP TRIGGER IF EXISTS update_macro_logs_updated_at ON public.macro_logs;
CREATE TRIGGER update_macro_logs_updated_at BEFORE UPDATE ON public.macro_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

-- ----------------------------------------------------------------------------
-- 6. WORKOUTS
-- ----------------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS public.workout_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  exercises jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
DROP TRIGGER IF EXISTS update_workout_templates_updated_at ON public.workout_templates;
CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON public.workout_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 7. PROGRESS PHOTOS
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 8. PLANNER & TASKS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#000000',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.task_categories(id) ON DELETE SET NULL,
  date date NOT NULL,
  title text NOT NULL,
  full_title text,
  description text,
  due_date text,
  due_time text,
  subtasks jsonb DEFAULT '[]'::jsonb,
  completed boolean DEFAULT false,
  priority text CHECK (priority IN ('high', 'medium', 'low', 'none')) DEFAULT 'none',
  reminder_time timestamp with time zone,
  notification_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.priorities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date, rank)
);

CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  remind_at timestamp with time zone NOT NULL,
  is_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 9. HABITS & ACHIEVEMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  frequency text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  unlocked_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 10. AI CHAT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  preferred_voice text,
  memory_enabled boolean DEFAULT true,
  streaming_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);
DROP TRIGGER IF EXISTS update_ai_settings_updated_at ON public.ai_settings;
CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON public.ai_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_id ON public.ai_messages(conversation_id);

-- ----------------------------------------------------------------------------
-- 11. FINANCE / EXPENSES
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    
    -- We assume every table has a user_id or id (for profiles) column that maps to auth.uid()
    IF t = 'profiles' THEN
      EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON public.%I;', t, t);
      EXECUTE format('CREATE POLICY "Users can view own %I" ON public.%I FOR SELECT USING (auth.uid() = id);', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON public.%I;', t, t);
      EXECUTE format('CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT WITH CHECK (auth.uid() = id);', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON public.%I;', t, t);
      EXECUTE format('CREATE POLICY "Users can update own %I" ON public.%I FOR UPDATE USING (auth.uid() = id);', t, t);
    ELSIF t = 'ai_messages' THEN
      -- Special case for ai_messages (joined through conversation_id)
      EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON public.%I;', t, t);
      EXECUTE format('CREATE POLICY "Users can view own %I" ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON public.%I;', t, t);
      EXECUTE format('CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON public.%I;', t, t);
      EXECUTE format('CREATE POLICY "Users can update own %I" ON public.%I FOR UPDATE USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON public.%I;', t, t);
      EXECUTE format('CREATE POLICY "Users can delete own %I" ON public.%I FOR DELETE USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));', t, t);
    ELSE
      -- All other tables must have user_id
      EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON public.%I;', t, t);
      EXECUTE format('CREATE POLICY "Users can view own %I" ON public.%I FOR SELECT USING (auth.uid() = user_id);', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON public.%I;', t, t);
      EXECUTE format('CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id);', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON public.%I;', t, t);
      EXECUTE format('CREATE POLICY "Users can update own %I" ON public.%I FOR UPDATE USING (auth.uid() = user_id);', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON public.%I;', t, t);
      EXECUTE format('CREATE POLICY "Users can delete own %I" ON public.%I FOR DELETE USING (auth.uid() = user_id);', t, t);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 13. STORAGE BUCKETS & POLICIES
-- ----------------------------------------------------------------------------
-- Ensure buckets exist (requires appropriate privileges)
INSERT INTO storage.buckets (id, name, public) VALUES ('progress_photos', 'progress_photos', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['progress_photos', 'avatars']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can upload own %I" ON storage.objects;', b);
    EXECUTE format('CREATE POLICY "Users can upload own %I" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''%I'' AND auth.uid() = (storage.foldername(name))[1]::uuid);', b, b);
    
    EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON storage.objects;', b);
    EXECUTE format('CREATE POLICY "Users can view own %I" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = ''%I'' AND auth.uid() = (storage.foldername(name))[1]::uuid);', b, b);
    
    EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON storage.objects;', b);
    EXECUTE format('CREATE POLICY "Users can update own %I" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''%I'' AND auth.uid() = (storage.foldername(name))[1]::uuid);', b, b);
    
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON storage.objects;', b);
    EXECUTE format('CREATE POLICY "Users can delete own %I" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''%I'' AND auth.uid() = (storage.foldername(name))[1]::uuid);', b, b);
  END LOOP;
END;
$$ LANGUAGE plpgsql;