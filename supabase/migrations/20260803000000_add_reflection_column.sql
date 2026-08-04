-- Migration: Add reflection column to daily_logs
-- Run this in your Supabase SQL editor

ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS reflection jsonb DEFAULT '{}'::jsonb;
