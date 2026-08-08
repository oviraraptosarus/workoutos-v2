-- Create telemetry_logs table for Observability Dashboard
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type text NOT NULL, -- e.g., PROMPT_RECEIVED, DB_WRITE, TOOL_EXECUTION, ERROR
    module text, -- e.g., Planner, AI, Memory, Notifications
    payload jsonb DEFAULT '{}'::jsonb,
    latency_ms integer,
    status text, -- SUCCESS, FAILED, INFO
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_telemetry_request_id ON public.telemetry_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_user_id ON public.telemetry_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON public.telemetry_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to insert and read their own telemetry (vital for client-side tool logging)
DROP POLICY IF EXISTS "Users can view their own telemetry" ON public.telemetry_logs;
CREATE POLICY "Users can view their own telemetry"
    ON public.telemetry_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert telemetry logs" ON public.telemetry_logs;
CREATE POLICY "Anyone can insert telemetry logs"
    ON public.telemetry_logs FOR INSERT
    WITH CHECK (true);
