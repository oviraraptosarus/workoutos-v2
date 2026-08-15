const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing award_xp RPC...");
    
    // Get a user ID first
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, xp').limit(1);
    if (pErr || !profiles || profiles.length === 0) {
        console.error("Could not fetch a user:", pErr);
        return;
    }
    const userId = profiles[0].id;
    console.log(`Found user: ${userId} with XP: ${profiles[0].xp}`);

    const { data, error } = await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_event_type: 'test_event',
        p_amount: 50,
        p_source_id: 'test_source_' + Date.now(),
        p_metadata: {}
    });

    console.log("RPC Data:", data);
    console.log("RPC Error:", error);

    const { data: prof2 } = await supabase.from('profiles').select('xp').eq('id', userId).single();
    console.log("XP after:", prof2.xp);
}

test();
