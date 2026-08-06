import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = envLocal.split('\n').reduce((acc, line) => {
    const [key, val] = line.split('=');
    if (key && val) acc[key.trim()] = val.trim();
    return acc;
}, {});

const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function inspect() {
    console.log("Fetching one row from workout_logs...");
    const { data: logs, error: logsErr } = await supabase.from('workout_logs').select('*').limit(1);
    if (logsErr) console.error("workout_logs error:", logsErr);
    else console.log("workout_logs schema (first row keys):", logs ? Object.keys(logs[0] || {}) : "Empty");

    console.log("\nFetching one row from workouts...");
    const { data: wkts, error: wktsErr } = await supabase.from('workouts').select('*').limit(1);
    if (wktsErr) console.error("workouts error:", wktsErr);
    else console.log("workouts schema (first row keys):", wkts ? Object.keys(wkts[0] || {}) : "Empty");
    
    console.log("\nFetching profile columns...");
    const { data: prof, error: profErr } = await supabase.from('profiles').select('*').limit(1);
    if (profErr) console.error("profiles error:", profErr);
    else console.log("profiles schema:", prof ? Object.keys(prof[0] || {}) : "Empty");
}
inspect();
