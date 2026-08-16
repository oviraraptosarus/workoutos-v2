-- Migration: Add Brain Readings table to support AI summarized journaling

CREATE TABLE IF NOT EXISTS public.brain_readings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.brain_readings ENABLE ROW LEVEL SECURITY;

-- Create policy for user access
CREATE POLICY "Users can manage their own brain readings" 
ON public.brain_readings 
FOR ALL USING (auth.uid() = user_id);
