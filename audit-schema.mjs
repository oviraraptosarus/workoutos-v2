import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToTest = [
  'telemetry_logs', 'tasks', 'habits', 'meal_entries', 'daily_logs', 
  'workouts', 'ai_memories', 'expenses', 'progress_photos', 'profiles',
  'workout_logs', 'command_center_items', 'execution_goals', 
  'notification_settings', 'smart_reminders_config', 'execution_profiles',
  'task_execution_scores', 'behavior_patterns', 'reminder_preferences'
];

async function runAudit() {
    console.log("Creating Test User A...");
    const emailA = `test_usera_${Date.now()}@example.com`;
    const emailB = `test_userb_${Date.now()}@example.com`;
    const pw = "SuperSecret123!";
    
    let { data: userAData, error: errA } = await supabase.auth.signUp({ email: emailA, password: pw });
    if (errA) {
        console.error("Failed to create User A:", errA);
        return;
    }
    const userA = userAData.user;
    console.log("User A created:", userA.id);

    let { data: userBData, error: errB } = await supabase.auth.signUp({ email: emailB, password: pw });
    if (errB) {
        console.error("Failed to create User B:", errB);
        return;
    }
    const userB = userBData.user;
    console.log("User B created:", userB.id);

    // Re-login as User A to ensure session
    await supabase.auth.signInWithPassword({ email: emailA, password: pw });
    console.log("\n--- Phase 1: Table Discovery & Insertion ---");
    
    const tableSchemas = {};
    const createdRecords = {};

    for (const table of tablesToTest) {
        console.log(`\nTesting table: ${table}`);
        // First try to insert an empty object to see what happens
        let payload = {};
        let success = false;
        let inferredColumns = [];
        let attempts = 0;

        while (!success && attempts < 10) {
            attempts++;
            const { data, error } = await supabase.from(table).insert([payload]).select();
            if (error) {
                if (error.code === 'PGRST205') {
                    console.log(`Table ${table} does NOT exist (or hidden by RLS).`);
                    tableSchemas[table] = { status: 'NOT_FOUND' };
                    break;
                }
                if (error.message.includes('not-null constraint')) {
                    const colMatch = error.message.match(/column "([^"]+)"/);
                    if (colMatch) {
                        const col = colMatch[1];
                        console.log(`  Missing required column: ${col}`);
                        // Provide a dummy value based on column name guess
                        if (col === 'user_id' || col === 'profile_id') payload[col] = userA.id;
                        else if (col.includes('date')) payload[col] = '2026-08-08';
                        else if (col.includes('name') || col.includes('title')) payload[col] = 'Test';
                        else if (col.includes('type')) payload[col] = 'Test';
                        else if (col.includes('status')) payload[col] = 'active';
                        else if (col.includes('calories') || col.includes('amount') || col.includes('duration')) payload[col] = 1;
                        else payload[col] = 'test';
                    } else {
                        console.log(`  Unknown not-null error: ${error.message}`);
                        tableSchemas[table] = { status: 'ERROR', message: error.message };
                        break;
                    }
                } else if (error.message.includes('violates row-level security')) {
                    console.log(`  RLS violation on insert. (Needs user_id?)`);
                    if (!payload.user_id) payload.user_id = userA.id;
                    else if (!payload.profile_id) payload.profile_id = userA.id;
                    else {
                        tableSchemas[table] = { status: 'RLS_BLOCKED' };
                        break;
                    }
                } else if (error.message.includes('foreign key constraint')) {
                     console.log(`  Foreign key violation: ${error.message}`);
                     tableSchemas[table] = { status: 'FK_BLOCKED', message: error.message };
                     break;
                } else {
                    console.log(`  Other error: ${error.message}`);
                    tableSchemas[table] = { status: 'ERROR', message: error.message };
                    break;
                }
            } else {
                console.log(`  Insert succeeded!`);
                success = true;
                if (data && data.length > 0) {
                    createdRecords[table] = data[0];
                    tableSchemas[table] = { status: 'EXISTS', columns: Object.keys(data[0]) };
                    console.log(`  Columns discovered: ${Object.keys(data[0]).join(', ')}`);
                }
            }
        }
    }
    
    console.log("\n--- Phase 2: User Isolation Test ---");
    await supabase.auth.signInWithPassword({ email: emailB, password: pw });
    
    for (const [table, record] of Object.entries(createdRecords)) {
        if (!record.id) continue;
        console.log(`\nTesting isolation for table: ${table}`);
        const { data, error } = await supabase.from(table).select('*').eq('id', record.id);
        if (error) {
            console.log(`  Select error: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`  🚨 VULNERABILITY: User B can read User A's record in ${table}!`);
        } else {
            console.log(`  ✅ User B cannot read User A's record.`);
        }
        
        // Attempt update
        const { error: updErr } = await supabase.from(table).update({ created_at: new Date() }).eq('id', record.id);
        if (updErr && updErr.code !== 'PGRST116') { // PGRST116 is 0 rows returned
           // could be a legit error or block
        }
    }
    
    console.log("\nFinal Schema Dump:");
    console.log(JSON.stringify(tableSchemas, null, 2));
}

runAudit();
