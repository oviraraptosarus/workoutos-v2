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

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auth Trigger for Profile Auto-Creation
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  daily_reminder boolean DEFAULT true,
  water_reminder boolean DEFAULT true,
  meal_reminder boolean DEFAULT true,
  workout_reminder boolean DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.smart_reminders_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reminder_type text NOT NULL,
  is_enabled boolean DEFAULT true,
  time time,
  recurring_days jsonb DEFAULT '[1,2,3,4,5,6,0]'::jsonb,
  interval_minutes integer,
  start_time time,
  end_time time,
  skip_next_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, reminder_type)
);
CREATE TRIGGER update_smart_reminders_config_updated_at BEFORE UPDATE ON public.smart_reminders_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
  snoozed_until timestamp with time zone,
  is_skipped boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
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
CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON public.ai_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
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
-- 13. STORAGE POLICIES
-- ----------------------------------------------------------------------------
-- Ensure buckets exist (must be done in Dashboard or via storage.buckets API)
-- Assuming 'progress_photos' and 'avatars' buckets are already created.

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