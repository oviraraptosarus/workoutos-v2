-- Enable RLS for notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own notification_settings' AND tablename = 'notification_settings') THEN
    CREATE POLICY "Users can view own notification_settings" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own notification_settings" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own notification_settings" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own notification_settings" ON public.notification_settings FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;
