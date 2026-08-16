-- Migration: Health Entries & Planner Tasks
-- File: supabase/migrations/20260802000003_health_and_planner.sql

-- 1. Bloodwork Entries
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

-- 2. Injury Logs
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

-- 3. Medication Logs
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

-- 4. Milestones
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

-- 5. Tasks (Planner)
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

-- 6. App State
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
