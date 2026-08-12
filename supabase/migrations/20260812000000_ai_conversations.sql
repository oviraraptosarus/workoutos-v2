CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    CREATE POLICY "Users can insert their own ai_conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Users can view their own ai_conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Users can update their own ai_conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Users can delete their own ai_conversations" ON public.ai_conversations FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON public.ai_conversations(updated_at DESC);
