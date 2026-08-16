-- Add gamification (xp) and dashboard customization (dashboard_config) to profiles

-- 1. Add xp column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'xp') THEN
        ALTER TABLE public.profiles ADD COLUMN xp INTEGER DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- 2. Add dashboard_config column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dashboard_config') THEN
        ALTER TABLE public.profiles ADD COLUMN dashboard_config JSONB DEFAULT NULL;
    END IF;
END $$;

-- 3. Ensure the columns are included in any necessary realtime publications if needed (optional)
-- (Profiles is typically already handled)
