const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
    try {
        console.log("Fetching first user from profiles...");
        const { data: profiles, error: pErr } = await supabase.from('profiles').select('id').limit(1);
        if (pErr || !profiles || profiles.length === 0) throw new Error("Could not find a user profile.");
        
        const userId = profiles[0].id;
        
        // Time 65 minutes ago so it immediately triggers the Escalation Engine (>60 mins)
        const pastTime = new Date(Date.now() - 65 * 60000).toISOString();
        
        console.log("Inserting dummy command center item...");
        const { error: iErr } = await supabase.from('command_center_items').insert({
            user_id: userId,
            title: 'Dummy Wrap-Up Test',
            description: 'You crushed it today! 5/5 tasks completed and 2200 kcal logged. Ready for tomorrow?',
            category: 'AI Insight',
            priority: 'medium',
            icon: 'rocket',
            source_module: 'Reflection',
            action_type: 'OPEN_PLANNER',
            status: 'active',
            created_at: pastTime
        });

        if (iErr) throw new Error("Insert failed: " + iErr.message);

        console.log("✅ Dummy notification inserted successfully!");
        console.log("👉 Go to your browser where the app is open. Within ~10-15 seconds, the Reminder Engine should escalate this and push a native Windows notification.");
    } catch (err) {
        console.error("Error:", err.message);
    }
})();
