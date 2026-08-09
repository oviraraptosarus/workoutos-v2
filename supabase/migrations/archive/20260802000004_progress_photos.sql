-- Migration: Progress Photos
-- File: supabase/migrations/20260802000004_progress_photos.sql

CREATE TABLE IF NOT EXISTS public.progress_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  taken_at timestamp with time zone,
  uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
  weight_snapshot numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_progress_photos_updated_at ON public.progress_photos;
CREATE TRIGGER update_progress_photos_updated_at
BEFORE UPDATE ON public.progress_photos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_id ON public.progress_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_date ON public.progress_photos(user_id, uploaded_at DESC);

-- Enable RLS
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress_photos" ON public.progress_photos;
CREATE POLICY "Users can view own progress_photos" 
ON public.progress_photos FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress_photos" ON public.progress_photos;
CREATE POLICY "Users can insert own progress_photos" 
ON public.progress_photos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress_photos" ON public.progress_photos;
CREATE POLICY "Users can update own progress_photos" 
ON public.progress_photos FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own progress_photos" ON public.progress_photos;
CREATE POLICY "Users can delete own progress_photos" 
ON public.progress_photos FOR DELETE 
USING (auth.uid() = user_id);
