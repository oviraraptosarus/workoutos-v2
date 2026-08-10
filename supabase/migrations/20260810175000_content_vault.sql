-- Create content_vault table
CREATE TABLE IF NOT EXISTS public.content_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    thumbnail_url TEXT,
    content_type TEXT DEFAULT 'link',
    status TEXT DEFAULT 'unread', -- 'unread', 'consumed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.content_vault ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own vault items"
    ON public.content_vault
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vault items"
    ON public.content_vault
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vault items"
    ON public.content_vault
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vault items"
    ON public.content_vault
    FOR DELETE
    USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_content_vault_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_vault_updated_at
BEFORE UPDATE ON public.content_vault
FOR EACH ROW
EXECUTE FUNCTION update_content_vault_updated_at();
