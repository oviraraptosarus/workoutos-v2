-- Migration: Ava AI Chat Persistence
-- File: supabase/migrations/20260802000005_ai_chat.sql

-- 1. AI Conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ai_conversations" ON public.ai_conversations;
CREATE POLICY "Users can view own ai_conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own ai_conversations" ON public.ai_conversations;
CREATE POLICY "Users can insert own ai_conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ai_conversations" ON public.ai_conversations;
CREATE POLICY "Users can update own ai_conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own ai_conversations" ON public.ai_conversations;
CREATE POLICY "Users can delete own ai_conversations" ON public.ai_conversations FOR DELETE USING (auth.uid() = user_id);

-- 2. AI Messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_id ON public.ai_messages(conversation_id);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ai_messages" ON public.ai_messages;
CREATE POLICY "Users can view own ai_messages" ON public.ai_messages FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own ai_messages" ON public.ai_messages;
CREATE POLICY "Users can insert own ai_messages" ON public.ai_messages FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own ai_messages" ON public.ai_messages;
CREATE POLICY "Users can delete own ai_messages" ON public.ai_messages FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
