import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ixqrijxdedtbxondzytn.supabase.co";
const supabaseKey = "sb_publishable_nF0uJxWX_u6dXEctsbbrRA_2j2-Y7gu";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTaskInsert() {
  const dummyUserId = "00000000-0000-0000-0000-000000000000";

  const newTaskObj = {
      user_id: dummyUserId,
      date: new Date().toISOString().split('T')[0],
      title: "Test Task via Script",
      full_title: "Test Task via Script",
      description: "Test Desc",
      due_date: null,
      due_time: null,
      subtasks: [],
      completed: false,
      priority: "medium",
      reminder_time: null
  };

  console.log("Attempting insert 1 (with priority & reminder_time)...");
  let res1 = await supabase.from('tasks').insert(newTaskObj).select().single();
  console.log("Result 1 Error:", res1.error?.message);

  if (res1.error) {
      console.log("\nAttempting fallback insert 2 (without priority & reminder_time)...");
      const fallbackObj = { ...newTaskObj };
      delete fallbackObj.reminder_time;
      delete fallbackObj.priority; // <--- The fix
      
      let res2 = await supabase.from('tasks').insert(fallbackObj).select().single();
      console.log("Result 2 Error Code:", res2.error?.code);
      console.log("Result 2 Error Message:", res2.error?.message);
      if (res2.data) console.log("Success! Inserted ID:", res2.data.id);
  }
}

testTaskInsert();
