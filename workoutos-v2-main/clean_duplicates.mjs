import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

if (urlMatch && keyMatch) {
  const sb = createClient(urlMatch[1], keyMatch[1]);
  sb.from('command_center_items')
    .select('id, title, user_id')
    .eq('status', 'active')
    .then(async (r) => {
        const items = r.data || [];
        const seen = new Set();
        const toDelete = [];
        
        for (const item of items) {
            const key = `${item.user_id}-${item.title}`;
            if (seen.has(key)) {
                toDelete.push(item.id);
            } else {
                seen.add(key);
            }
        }
        
        if (toDelete.length > 0) {
            console.log(`Found ${toDelete.length} duplicates. Deleting...`);
            const { error } = await sb.from('command_center_items').delete().in('id', toDelete);
            if (error) console.error(error);
            else console.log("Done.");
        } else {
            console.log("No duplicates found.");
        }
    });
}
