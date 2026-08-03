-- Migration: Auth Trigger for automatic profile creation
-- File: supabase/migrations/20260802000008_auth_trigger.sql

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, username, 
    accepted_terms, accepted_privacy, terms_version, privacy_version, accepted_at
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', lower(split_part(NEW.email, '@', 1))),
    COALESCE((NEW.raw_user_meta_data->>'accepted_terms')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'accepted_privacy')::boolean, false),
    NEW.raw_user_meta_data->>'terms_version',
    NEW.raw_user_meta_data->>'privacy_version',
    (NEW.raw_user_meta_data->>'accepted_at')::timestamptz
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
