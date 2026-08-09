-- Migration: Add reminders and notifications to tasks
-- File: supabase/migrations/20260802000007_task_reminders.sql

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS reminder_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS notification_sent boolean DEFAULT false;
