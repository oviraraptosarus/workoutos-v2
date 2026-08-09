-- Premium Evolution Migration: AI Memories & Advanced Reminders

-- 1. AI Memories Table
CREATE TABLE IF NOT EXISTS public.ai_memories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  memory_text text NOT NULL,
  confidence_score numeric DEFAULT 1.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER update_ai_memories_updated_at BEFORE UPDATE ON public.ai_memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for ai_memories
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ai_memories" ON public.ai_memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai_memories" ON public.ai_memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai_memories" ON public.ai_memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ai_memories" ON public.ai_memories FOR DELETE USING (auth.uid() = user_id);


-- 2. Enhanced Reminder Preferences
CREATE TABLE IF NOT EXISTS public.reminder_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- e.g., 'water', 'sleep', 'workout', 'diet', 'breakfast', 'lunch', 'dinner', 'snack', 'reflection', 'budget', 'mood', 'progress_photo', 'meditation', 'walk', 'stretch', 'weight', 'journal'
  is_enabled boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb, -- stores: days, time, repeat, frequency, sound, vibration, silent_mode, smart_detection, snooze_duration, skip_once, notification_style
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, type)
);

CREATE TRIGGER update_reminder_preferences_updated_at BEFORE UPDATE ON public.reminder_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for reminder_preferences
ALTER TABLE public.reminder_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reminder_preferences" ON public.reminder_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminder_preferences" ON public.reminder_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminder_preferences" ON public.reminder_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminder_preferences" ON public.reminder_preferences FOR DELETE USING (auth.uid() = user_id);
