-- Sync Backend Architecture Migration
-- Option B: Onboarding logic and Command Center enhancements

-- 1. Profiles Table Updates
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS activity_level text CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'athlete')),
  ADD COLUMN IF NOT EXISTS bmi numeric,
  ADD COLUMN IF NOT EXISTS bmr numeric,
  ADD COLUMN IF NOT EXISTS tdee numeric,
  ADD COLUMN IF NOT EXISTS protein_goal numeric,
  ADD COLUMN IF NOT EXISTS fat_goal numeric,
  ADD COLUMN IF NOT EXISTS carb_goal numeric;

-- 2. Notification Settings Updates
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

ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS notification_sound boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS vibration_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_enabled boolean DEFAULT false;

-- 3. Command Center Items Table
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

-- Note: We avoid recreating triggers IF NOT EXISTS doesn't exist for triggers directly in postgres < 14 without DO blocks.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_command_center_items_updated_at') THEN
    CREATE TRIGGER update_command_center_items_updated_at 
      BEFORE UPDATE ON public.command_center_items 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- RLS for command_center_items
ALTER TABLE public.command_center_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own command_center_items' AND tablename = 'command_center_items') THEN
    CREATE POLICY "Users can view own command_center_items" ON public.command_center_items FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own command_center_items" ON public.command_center_items FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own command_center_items" ON public.command_center_items FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own command_center_items" ON public.command_center_items FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 4. Auth Auto-Creation Trigger (Option B)
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

-- 5. Fitness Engine Trigger
CREATE OR REPLACE FUNCTION public.calculate_fitness_metrics() 
RETURNS TRIGGER AS $$
DECLARE
  v_age integer;
  v_multiplier numeric;
  v_bmr numeric;
  v_tdee numeric;
  v_cal_goal numeric;
BEGIN
  IF NEW.height_cm IS NOT NULL AND NEW.current_weight IS NOT NULL AND NEW.dob IS NOT NULL THEN
    NEW.bmi := NEW.current_weight / ((NEW.height_cm / 100.0) ^ 2);
    v_age := extract(year from age(current_date, NEW.dob));
    
    IF NEW.gender = 'female' THEN
      v_bmr := (10 * NEW.current_weight) + (6.25 * NEW.height_cm) - (5 * v_age) - 161;
    ELSE
      v_bmr := (10 * NEW.current_weight) + (6.25 * NEW.height_cm) - (5 * v_age) + 5;
    END IF;
    NEW.bmr := v_bmr;
    
    v_multiplier := CASE 
      WHEN NEW.activity_level = 'sedentary' THEN 1.2
      WHEN NEW.activity_level = 'light' THEN 1.375
      WHEN NEW.activity_level = 'moderate' THEN 1.55
      WHEN NEW.activity_level = 'active' THEN 1.725
      WHEN NEW.activity_level = 'athlete' THEN 1.9
      ELSE 1.2
    END;
    v_tdee := v_bmr * v_multiplier;
    NEW.tdee := v_tdee;
    
    v_cal_goal := CASE
      WHEN NEW.fitness_goal ILIKE '%Fat%' OR NEW.fitness_goal ILIKE '%Lose%' THEN v_tdee - 500
      WHEN NEW.fitness_goal ILIKE '%Muscle%' OR NEW.fitness_goal ILIKE '%Gain%' THEN v_tdee + 300
      ELSE v_tdee
    END;
    NEW.calorie_goal := round(v_cal_goal);
    
    IF NEW.target_weight IS NOT NULL THEN
      NEW.protein_goal := round(2.0 * NEW.target_weight);
    ELSE
      NEW.protein_goal := round(2.0 * NEW.current_weight);
    END IF;
    
    NEW.fat_goal := round((v_cal_goal * 0.25) / 9.0);
    NEW.carb_goal := round((v_cal_goal - (NEW.protein_goal * 4) - (NEW.fat_goal * 9)) / 4.0);
    IF NEW.carb_goal < 0 THEN NEW.carb_goal := 0; END IF;
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

-- 6. Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('progress_photos', 'progress_photos', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
