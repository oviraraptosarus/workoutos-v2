CREATE TABLE IF NOT EXISTS public.user_gacha_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  item_type text NOT NULL, -- 'theme', 'sticker', 'ticket'
  item_name text NOT NULL,
  acquired_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.user_gacha_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own gacha inventory"
    ON public.user_gacha_inventory FOR ALL
    USING (auth.uid() = user_id);
