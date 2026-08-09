-- Migration: Add terms columns to profiles
-- File: supabase/migrations/20260804000000_add_terms_to_profiles.sql

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS accepted_terms boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS accepted_privacy boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_version text,
ADD COLUMN IF NOT EXISTS privacy_version text,
ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
