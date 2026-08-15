-- Migration: Dictation Audio and Language Settings

-- 1. Add dictation_language to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dictation_language text DEFAULT 'en-US';

-- 2. Add audio_url to daily_logs
ALTER TABLE public.daily_logs
ADD COLUMN IF NOT EXISTS audio_url text;

-- 3. Create Supabase Storage Bucket for Journal Audio
INSERT INTO storage.buckets (id, name, public) 
VALUES ('journal_audio', 'journal_audio', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Set up RLS for the bucket
-- Allow authenticated users to upload their own audio files
DROP POLICY IF EXISTS "Users can upload their own audio files" ON storage.objects;
CREATE POLICY "Users can upload their own audio files" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'journal_audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to view their own audio files
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;
CREATE POLICY "Users can view their own audio files" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'journal_audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own audio files
DROP POLICY IF EXISTS "Users can delete their own audio files" ON storage.objects;
CREATE POLICY "Users can delete their own audio files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'journal_audio' AND auth.uid()::text = (storage.foldername(name))[1]);
