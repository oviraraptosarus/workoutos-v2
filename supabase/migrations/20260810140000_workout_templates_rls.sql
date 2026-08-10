-- Enable RLS on workout_templates if not already enabled
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view their own workout templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can insert their own workout templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can update their own workout templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can delete their own workout templates" ON public.workout_templates;

-- Create RLS policies
CREATE POLICY "Users can view their own workout templates"
  ON public.workout_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout templates"
  ON public.workout_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout templates"
  ON public.workout_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout templates"
  ON public.workout_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON public.workout_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_created_at ON public.workout_templates(user_id, created_at DESC);
