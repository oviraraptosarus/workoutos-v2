-- XP System Migration

-- 1. Ensure `xp` column exists (it should, but just in case)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'xp') THEN
        ALTER TABLE public.profiles ADD COLUMN xp INTEGER DEFAULT 0 NOT NULL;
    END IF;
END
$$;

-- 2. Create xp_transactions table
CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    event_type text NOT NULL,
    xp_amount integer NOT NULL,
    source_id text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, source_id)
);

-- RLS for xp_transactions
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own XP transactions" ON public.xp_transactions;

CREATE POLICY "Users can view their own XP transactions"
    ON public.xp_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Note: No INSERT/UPDATE/DELETE policies for client. Only RPC can insert.

-- 3. Create level calculation function
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(total_xp integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    current_level integer := 1;
    xp_for_next integer;
    cumulative_xp integer := 0;
BEGIN
    WHILE current_level < 50 LOOP
        xp_for_next := round(100 * power(1.08, current_level - 1));
        IF total_xp >= cumulative_xp + xp_for_next THEN
            cumulative_xp := cumulative_xp + xp_for_next;
            current_level := current_level + 1;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    RETURN current_level;
END;
$$;

-- 4. Create atomic XP award RPC
CREATE OR REPLACE FUNCTION public.award_xp(
    p_user_id uuid,
    p_event_type text,
    p_amount integer,
    p_source_id text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_total integer;
    v_new_total integer;
    v_old_level integer;
    v_new_level integer;
    v_transaction_id uuid;
BEGIN
    -- Idempotency check
    IF EXISTS (
        SELECT 1 FROM public.xp_transactions
        WHERE user_id = p_user_id AND source_id = p_source_id
    ) THEN
        RETURN jsonb_build_object(
            'awarded', false,
            'xpAwarded', 0
        );
    END IF;

    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('awarded', false, 'xpAwarded', 0);
    END IF;

    -- Lock profile row
    SELECT xp, level INTO v_old_total, v_old_level 
    FROM public.profiles 
    WHERE id = p_user_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Insert transaction
    INSERT INTO public.xp_transactions (user_id, event_type, xp_amount, source_id, metadata)
    VALUES (p_user_id, p_event_type, p_amount, p_source_id, p_metadata)
    RETURNING id INTO v_transaction_id;

    -- Update total
    v_new_total := v_old_total + p_amount;
    
    -- Calculate new level
    v_new_level := public.calculate_level_from_xp(v_new_total);

    -- Update profile
    UPDATE public.profiles
    SET 
        xp = v_new_total,
        level = v_new_level
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'awarded', true,
        'xpAwarded', p_amount,
        'totalXP', v_new_total,
        'oldLevel', v_old_level,
        'newLevel', v_new_level,
        'leveledUp', (v_new_level > v_old_level)
    );
END;
$$;

-- 5. Data Migration for existing users
DO $$
DECLARE
    r record;
    min_xp integer;
    lvl integer;
BEGIN
    FOR r IN SELECT id, level FROM public.profiles WHERE level > 1 AND xp = 0 LOOP
        min_xp := 0;
        FOR lvl IN 1..(r.level - 1) LOOP
            min_xp := min_xp + round(100 * power(1.08, lvl - 1));
        END LOOP;
        
        UPDATE public.profiles
        SET xp = min_xp
        WHERE id = r.id;
    END LOOP;
END;
$$;
