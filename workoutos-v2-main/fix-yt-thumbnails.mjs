import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const val = match[2].trim().replace(/^["']|["']$/g, '');
            process.env[key] = val;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBrokenYouTubeLinks() {
    console.log("Fetching content vault items...");
    
    const { data: items, error } = await supabase
        .from('content_vault')
        .select('*');

    if (error) {
        console.error("Error fetching items:", error);
        return;
    }
    
    for (const item of items) {
        if (item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be'))) {
            console.log(`ID: ${item.id} | Title: ${item.title} | Thumb: ${item.thumbnail_url}`);
        }
    }
}

fixBrokenYouTubeLinks();
