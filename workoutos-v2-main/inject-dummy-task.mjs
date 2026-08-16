import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env.local manually
const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = envLocal.split('\n').reduce((acc, line) => {
    const [key, val] = line.split('=');
    if (key && val) acc[key.trim()] = val.trim();
    return acc;
}, {});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function injectDummyTask() {
    console.log("Fetching user...");
    const { data: users, error: userErr } = await supabase.from('profiles').select('id').limit(1);
    
    if (userErr || !users || users.length === 0) {
        console.error("Could not find a user profile.", userErr);
        return;
    }
    const userId = users[0].id;
    console.log("Found user ID:", userId);
    
    const today = new Date().toISOString().split('T')[0];
    
    // Insert dummy task
    console.log("Inserting dummy task...");
    const { data: taskData, error: taskErr } = await supabase.from('tasks').insert({
        user_id: userId,
        date: today,
        title: "Dummy Backend Task",
        full_title: "Dummy Backend Task for Verification",
        description: "This is the dummy task you requested to verify the backend is working.",
        completed: false
    }).select().single();
    
    if (taskErr) {
        console.error("Task insert error:", taskErr);
    } else {
        console.log("Successfully inserted task:", taskData.id);
    }
    
    // Insert dummy reminder
    console.log("Inserting dummy reminder...");
    const { data: reminderData, error: reminderErr } = await supabase.from('command_center_items').insert({
        user_id: userId,
        title: "Wash face (Backend Verification)",
        description: "You asked me to remind you about washing your face.",
        category: 'Reminder',
        priority: 'medium',
        icon: 'bell',
        source_module: 'Ava',
        due_at: new Date(Date.now() + 5 * 60000).toISOString() // 5 mins from now
    }).select().single();
    
    if (reminderErr) {
        console.error("Reminder insert error:", reminderErr);
    } else {
        console.log("Successfully inserted reminder:", reminderData.id);
    }
    
    console.log("Done.");
}

injectDummyTask();
