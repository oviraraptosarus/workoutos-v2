-- Adds the missing Date of Birth and legal consent columns to the profiles table
-- Safely uses IF NOT EXISTS so it won't break if run multiple times.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dob date,
ADD COLUMN IF NOT EXISTS accepted_terms boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS accepted_privacy boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_version text,
ADD COLUMN IF NOT EXISTS privacy_version text,
ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
