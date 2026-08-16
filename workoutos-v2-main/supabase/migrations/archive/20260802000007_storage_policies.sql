-- Migration: Storage Bucket RLS Policies (progress_photos & avatars)
-- File: supabase/migrations/20260802000007_storage_policies.sql

-- NOTE: Ensure buckets 'progress_photos' and 'avatars' are created as PRIVATE buckets in the Supabase Dashboard.

-------------------------------------------------------------------------------
-- 1. PROGRESS PHOTOS BUCKET POLICIES
-------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload own progress_photos" ON storage.objects;
CREATE POLICY "Users can upload own progress_photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'progress_photos' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid
);

DROP POLICY IF EXISTS "Users can view own progress_photos" ON storage.objects;
CREATE POLICY "Users can view own progress_photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'progress_photos' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid
);

DROP POLICY IF EXISTS "Users can update own progress_photos" ON storage.objects;
CREATE POLICY "Users can update own progress_photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'progress_photos' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid
);

DROP POLICY IF EXISTS "Users can delete own progress_photos" ON storage.objects;
CREATE POLICY "Users can delete own progress_photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'progress_photos' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-------------------------------------------------------------------------------
-- 2. AVATARS BUCKET POLICIES
-------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid
);

DROP POLICY IF EXISTS "Users can view own avatars" ON storage.objects;
CREATE POLICY "Users can view own avatars"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid
);

DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid
);

DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid
);
