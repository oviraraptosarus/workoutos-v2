-- Migration: User Psychological Profiles

CREATE TABLE IF NOT EXISTS public.psychological_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    freudian_analysis TEXT NOT NULL DEFAULT '',
    dopamine_triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE public.psychological_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    CREATE POLICY "Users can insert their own psychological_profile" ON public.psychological_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Users can view their own psychological_profile" ON public.psychological_profiles FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Users can update their own psychological_profile" ON public.psychological_profiles FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Users can delete their own psychological_profile" ON public.psychological_profiles FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

-- Update trigger
CREATE OR REPLACE FUNCTION update_psychological_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_psychological_profiles_updated_at ON public.psychological_profiles;
CREATE TRIGGER update_psychological_profiles_updated_at
BEFORE UPDATE ON public.psychological_profiles
FOR EACH ROW
EXECUTE FUNCTION update_psychological_profiles_updated_at();

-- Force Schema Cache reload
NOTIFY pgrst, 'reload schema';
