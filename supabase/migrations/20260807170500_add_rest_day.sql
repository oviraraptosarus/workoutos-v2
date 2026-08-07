-- Migration: Add is_rest_day to daily_logs

ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS is_rest_day BOOLEAN DEFAULT false;
