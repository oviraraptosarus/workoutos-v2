-- Migration: End of Day Review & Brain Dump Support

-- 1. Add raw_transcript for storing the original voice/text dump
ALTER TABLE public.daily_logs 
ADD COLUMN IF NOT EXISTS raw_transcript text;

-- 2. Update reflection column to text (previously jsonb)
ALTER TABLE public.daily_logs 
ALTER COLUMN reflection DROP DEFAULT;

ALTER TABLE public.daily_logs 
ALTER COLUMN reflection TYPE text USING reflection::text;
