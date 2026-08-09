-- ============================================================================
-- Execution OS V3 Additive Layer Schema
-- ============================================================================
-- Extends the core architecture without modifying existing tables.
-- Follows V3.1 "Adapters Over Rewrites" constraints.
-- ============================================================================

-- 1. Execution Profiles (Additive Layer for profiles)
CREATE TABLE IF NOT EXISTS public.execution_profiles (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  daily_execution_budget integer DEFAULT 100,
  momentum_score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER update_execution_profiles_updated_at BEFORE UPDATE ON public.execution_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.execution_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own execution_profiles" ON public.execution_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own execution_profiles" ON public.execution_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own execution_profiles" ON public.execution_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own execution_profiles" ON public.execution_profiles FOR DELETE USING (auth.uid() = user_id);

-- Auto-insert execution profiles for existing users
INSERT INTO public.execution_profiles (user_id)
SELECT id FROM public.profiles
ON CONFLICT DO NOTHING;

-- Trigger to auto-create execution_profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_execution_profile() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.execution_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_create_execution_profile AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_new_execution_profile();

-- 2. Execution Goals (The new Macro Hierarchy)
CREATE TABLE IF NOT EXISTS public.execution_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  life_area text CHECK (life_area IN ('Fitness', 'Career', 'Learning', 'Personal', 'Finance', 'Health')),
  target_date date,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER update_execution_goals_updated_at BEFORE UPDATE ON public.execution_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.execution_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own execution_goals" ON public.execution_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own execution_goals" ON public.execution_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own execution_goals" ON public.execution_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own execution_goals" ON public.execution_goals FOR DELETE USING (auth.uid() = user_id);

-- 3. Task Execution Scores (Adapter Layer for tasks)
CREATE TABLE IF NOT EXISTS public.task_execution_scores (
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  goal_id uuid REFERENCES public.execution_goals(id) ON DELETE SET NULL,
  execution_probability integer DEFAULT 50 CHECK (execution_probability >= 0 AND execution_probability <= 100),
  energy_cost integer DEFAULT 10,
  parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER update_task_execution_scores_updated_at BEFORE UPDATE ON public.task_execution_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.task_execution_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own task_execution_scores" ON public.task_execution_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own task_execution_scores" ON public.task_execution_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own task_execution_scores" ON public.task_execution_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own task_execution_scores" ON public.task_execution_scores FOR DELETE USING (auth.uid() = user_id);

-- 4. Behavior Patterns (Ava's Stateful Memory)
CREATE TABLE IF NOT EXISTS public.behavior_patterns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pattern_description text NOT NULL,
  confidence_score integer DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  source text DEFAULT 'ai_analyst',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER update_behavior_patterns_updated_at BEFORE UPDATE ON public.behavior_patterns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.behavior_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own behavior_patterns" ON public.behavior_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own behavior_patterns" ON public.behavior_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own behavior_patterns" ON public.behavior_patterns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own behavior_patterns" ON public.behavior_patterns FOR DELETE USING (auth.uid() = user_id);
