-- Migration: Add steps column to daily_logs

ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS steps INTEGER DEFAULT 0;
