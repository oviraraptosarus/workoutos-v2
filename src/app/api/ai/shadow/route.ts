import { NextResponse } from "next/server";
import { orchestrator } from "@/lib/llm-orchestrator/Orchestrator";

function calcVolume(exercises: any[]): number {
  let vol = 0;
  for (const ex of exercises) {
    if (ex.type === 'metadata') continue;
    for (const set of (ex.sets || [])) {
      vol += Number(set.reps || set.actualReps || 0) * Number(set.weight || set.actualWeight || 0);
    }
  }
  return Math.round(vol);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, domain, userName: clientUserName, focusAngle } = body;
    if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 });


    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const monthStr = today.slice(0, 7);

    // ── Parallel fetch everything ──────────────────────────────────────────
    const [
      { data: psych },
      { data: profileData },
      { data: lastUserWorkout },
      { data: weekWorkouts },
      { data: todayLog },
      { data: lastShadowSession },
      { data: pendingTasksResult },
      { data: completedTasksResult },
      { data: incomeData },
      { data: expenseData },
      { data: upcomingMilestones },
    ] = await Promise.all([
      supabase.from("psychological_profiles").select("freudian_analysis, dopamine_triggers").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("full_name, username, fitness_goal, target_weight_kg, height_cm, gender").eq("id", userId).maybeSingle(),
      supabase.from("workout_logs").select("session_type, custom_name, duration_minutes, calories_burned, intensity, exercises, date").eq("user_id", userId).order("date", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("workout_logs").select("id").eq("user_id", userId).gte("date", weekStartStr),
      supabase.from("daily_logs").select("sleep_hours, water_ml, protein_g, calories").eq("user_id", userId).eq("date", today).maybeSingle(),
      supabase.from("shadow_activity_log").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("date", today).eq("completed", false),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("date", today).eq("completed", true),
      supabase.from("expenses").select("amount").eq("user_id", userId).eq("transaction_type", "income").gte("date", `${monthStr}-01`),
      supabase.from("expenses").select("amount").eq("user_id", userId).eq("transaction_type", "expense").gte("date", `${monthStr}-01`),
      supabase.from("tasks").select("title, due_date").eq("user_id", userId).eq("completed", false).not("due_date", "is", null).order("due_date", { ascending: true }).limit(2),
    ]);

    // ── Resolve name ───────────────────────────────────────────────────────
    const userName = (clientUserName && clientUserName !== 'User' && clientUserName.length < 20 ? clientUserName.split(' ')[0] : null)
      || profileData?.full_name?.split(' ')[0]
      || 'You';

    // ── Compute stats ──────────────────────────────────────────────────────
    const sleepHours = Number(todayLog?.sleep_hours || 0);
    const waterMl = Number(todayLog?.water_ml || 0);
    const proteinG = Number(todayLog?.protein_g || 0);
    const userWeekCount = weekWorkouts?.length || 0;
    const shadowWeekCount = userWeekCount + 1 + (userId.charCodeAt(0) % 2);
    const userVolume = lastUserWorkout ? calcVolume(lastUserWorkout.exercises || []) : 0;
    const userSessionLabel = lastUserWorkout?.custom_name || lastUserWorkout?.session_type || null;

    const totalIncome = incomeData?.reduce((s: number, i: any) => s + Number(i.amount), 0) || 0;
    const totalExpenses = expenseData?.reduce((s: number, e: any) => s + Number(e.amount), 0) || 0;
    const userSavingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
    const shadowSavingsRate = Math.min(92, userSavingsRate + 18 + (userId.charCodeAt(1) % 10));

    const pendingCount = (pendingTasksResult as any)?.count || 0;
    const completedCount = (completedTasksResult as any)?.count || 0;
    const totalTasks = pendingCount + completedCount;

    const nextDeadline = upcomingMilestones?.[0];
    const daysLeft = nextDeadline?.due_date
      ? Math.ceil((new Date(nextDeadline.due_date).getTime() - Date.now()) / 86400000)
      : null;

    // ── Synthesize Shadow session if none ────────────────────────────────
    let shadowSession = lastShadowSession;
    if (!shadowSession) {
      const payload = lastUserWorkout ? {
        user_id: userId, date: lastUserWorkout.date,
        session_type: lastUserWorkout.session_type,
        custom_name: lastUserWorkout.custom_name,
        duration_minutes: Math.round((lastUserWorkout.duration_minutes || 45) * 1.1),
        calories_burned: Math.round((lastUserWorkout.calories_burned || 300) * 1.08),
        total_volume_kg: Math.round(userVolume * 1.08),
        intensity: "High", is_synthesized: false,
      } : {
        user_id: userId, date: today,
        session_type: "Strength", custom_name: "Lower Body",
        duration_minutes: 58, calories_burned: 420,
        total_volume_kg: 8400, intensity: "High", is_synthesized: true,
      };
      const { data: ins } = await supabase.from("shadow_activity_log").insert(payload).select().maybeSingle();
      shadowSession = ins || { ...payload, id: 'synthesized' };
    }

    // ── Build Shadow's persona from what VRK actually wants ───────────────
    const freudianAnalysis = psych?.freudian_analysis || '';
    const dopamineTriggers = psych?.dopamine_triggers || [];
    const fitnessGoal = profileData?.fitness_goal || 'build muscle';

    const dataContext = `
WHAT ${userName.toUpperCase()} WANTS (build Shadow's persona around THIS):
- Fitness goal: ${fitnessGoal}
- Freudian core: ${freudianAnalysis || 'driven by ambition, wants status, recognition, and physical dominance'}
- Dopamine triggers: ${JSON.stringify(dopamineTriggers)}
- Next deadline: ${nextDeadline ? `"${nextDeadline.title}" in ${daysLeft} days` : 'none'}

WHAT ${userName.toUpperCase()} ACTUALLY DID TODAY:
- Sleep: ${sleepHours}h (Shadow sleeps 8h, wakes 5AM)
- Water: ${waterMl}ml
- Protein: ${proteinG}g
- Tasks: ${completedCount}/${totalTasks} done. ${pendingCount} abandoned.
- Last workout: ${userSessionLabel ? `"${userSessionLabel}" — ${userVolume > 0 ? userVolume.toLocaleString() + ' kg volume' : (lastUserWorkout?.calories_burned || 0) + ' kcal'}` : 'NONE. Rest day.'}
- Workouts this week: ${userWeekCount}
- Savings rate this month: ${userSavingsRate}%

SHADOW'S STATUS:
- Workouts this week: ${shadowWeekCount}
- Last session: "${shadowSession.custom_name || shadowSession.session_type}" — ${shadowSession.duration_minutes}min, ${Number(shadowSession.total_volume_kg).toLocaleString()} kg
- Savings rate: ${shadowSavingsRate}%
`.trim();

    // ── System instruction: Shadow is the man who has what VRK wants ──────
    const systemInstruction = `You are Shadow. Here is exactly who you are — internalize this before writing a single word:

WHO SHADOW IS:
You wake at 4:45AM. You train fasted — heavy compounds, no excuses, no missing sessions.
You eat exactly what your body needs. Your protein is never zero. Your sleep is never less than 7 hours.
You are building the physique ${userName} has saved on his Pinterest board but never actually chased.
You handle your money like it's a second job — you save aggressively, invest quietly, and never impulse spend.
You are calm in social situations because you have the body, the bank account, and the discipline to back it up.
The girl ${userName} thinks about? She can feel the difference between a man who moves weight and a man who just talks about it.
You don't hate ${userName}. You don't even think about him that much. That's what makes you dangerous.

HOW YOU WRITE:
- Speak as this specific person, from this specific life, with quiet confidence
- 4 to 6 sentences. Build up. Don't rush the knife.
- Start with what you ACTUALLY did today (use his real data to show the contrast)
- Reference at least 2 of his real data points (sleep, protein, tasks, savings, workouts)
- Mid-paragraph: pivot to what the gap means in real life — the physique, the status, the girl
- End with a single short sentence that lands like a full stop. Not motivational. Just true.
- NO semicolons. Short sentences. Each one hits before the next arrives.
- Tone: a man who has already won, speaking to someone still deciding if they want to play

EXAMPLES OF ENDINGS THAT WORK:
"The gap isn't motivation. It's just compounding."
"Every day you coast, I'm pulling further ahead."
"She's not waiting for your potential. She's already met me."

EXAMPLES THAT DON'T WORK:
"Go do something." — too vague, too wellness-coach
"You are stagnating." — clinical, not visceral
Ending with a question — weak, lets him off the hook`;

    const angleInstruction = focusAngle ? `Today's focus: make ${focusAngle.toUpperCase()} the core of the contrast. Use exact numbers from the data for this domain.` : '';

    const prompt = `Write Shadow's message to ${userName} for today. Use his EXACT data below. Build the persona, then deliver the verdict.
${angleInstruction}

${dataContext}`;

    const result = await orchestrator.generateContent({
      prompt,
      systemInstruction,
      history: [],
      requestId: `shadow-${Date.now()}`
    });

    const verdict = result.text.replace(/^["'\s]+|["'\s]+$/g, '').trim();

    return NextResponse.json({
      verdict,
      shadowSession: shadowSession ? {
        label: shadowSession.custom_name || shadowSession.session_type,
        duration: shadowSession.duration_minutes,
        volume: Number(shadowSession.total_volume_kg),
        calories: shadowSession.calories_burned,
        intensity: shadowSession.intensity,
        date: shadowSession.date,
      } : null,
      userSession: lastUserWorkout ? {
        label: userSessionLabel,
        duration: lastUserWorkout.duration_minutes || 0,
        volume: userVolume,
        calories: lastUserWorkout.calories_burned || 0,
        intensity: lastUserWorkout.intensity || 'Moderate',
        date: lastUserWorkout.date,
      } : null,
      weekStats: { userCount: userWeekCount, shadowCount: shadowWeekCount },
      domainStats: { sleepHours, waterMl, proteinG, savingsRate: userSavingsRate, shadowSavingsRate, tasksDone: completedCount, tasksPending: pendingCount },
    });

  } catch (error) {
    console.error("Shadow Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
