import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

if (urlMatch && keyMatch) {
  const sb = createClient(urlMatch[1], keyMatch[1]);
  sb.from('tasks').select('*').order('created_at', {ascending: false}).limit(10).then(r => {
    console.log(JSON.stringify(r.data, null, 2));
  });
}
