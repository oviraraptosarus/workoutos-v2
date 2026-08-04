-- Add missing configuration and preference columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS preferred_ai_voice text,
  ADD COLUMN IF NOT EXISTS voice_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_memory_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS appearance_prefs jsonb DEFAULT '{"dark_mode": "false", "text_scale": 1.0}'::jsonb,
  ADD COLUMN IF NOT EXISTS on_appetite_affecting_medication boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tracks_menstrual_cycle boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS target_config jsonb DEFAULT '{}'::jsonb;
