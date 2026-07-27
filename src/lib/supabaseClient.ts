import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ixqrijxdedtbxondzytn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_nF0uJxWX_u6dXEctsbbrRA_2j2-Y7gu';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
