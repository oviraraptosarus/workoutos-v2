-- Migration: Barcode Food Scans
-- File: supabase/migrations/20260802000006_food_scans.sql

CREATE TABLE IF NOT EXISTS public.food_scans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  barcode text,
  product_name text,
  image_url text,
  brand text,
  serving_size text,
  nutrition_json jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_food_scans_updated_at ON public.food_scans;
CREATE TRIGGER update_food_scans_updated_at
BEFORE UPDATE ON public.food_scans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_food_scans_user_id ON public.food_scans(user_id);

ALTER TABLE public.food_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own food_scans" ON public.food_scans;
CREATE POLICY "Users can view own food_scans" ON public.food_scans FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own food_scans" ON public.food_scans;
CREATE POLICY "Users can insert own food_scans" ON public.food_scans FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own food_scans" ON public.food_scans;
CREATE POLICY "Users can update own food_scans" ON public.food_scans FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own food_scans" ON public.food_scans;
CREATE POLICY "Users can delete own food_scans" ON public.food_scans FOR DELETE USING (auth.uid() = user_id);
