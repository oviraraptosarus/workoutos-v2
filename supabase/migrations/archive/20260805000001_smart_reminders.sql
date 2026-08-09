-- 1. Create smart_reminders_config table
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

-- RLS for smart_reminders_config
ALTER TABLE public.smart_reminders_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own smart_reminders_config" ON public.smart_reminders_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own smart_reminders_config" ON public.smart_reminders_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own smart_reminders_config" ON public.smart_reminders_config FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own smart_reminders_config" ON public.smart_reminders_config FOR DELETE USING (auth.uid() = user_id);

-- 2. Modify command_center_items
ALTER TABLE public.command_center_items ADD COLUMN IF NOT EXISTS snoozed_until timestamp with time zone;
ALTER TABLE public.command_center_items ADD COLUMN IF NOT EXISTS is_skipped boolean DEFAULT false;
