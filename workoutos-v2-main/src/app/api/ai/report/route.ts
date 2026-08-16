import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/llm-orchestrator/Orchestrator';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { historicalData, userProfile, preferredLanguage } = body;

        const systemInstruction = `You are "Nova", an elite fitness and finance analyst AI for "Workout OS".
Your task is to analyze the provided 14 days of historical data for the user and generate a comprehensive, highly insightful Bi-Weekly Report.
User Profile Context:
- Full Name: ${userProfile?.fullName || 'User'}
- Fitness Goal: ${userProfile?.fitnessGoal || 'General Health'}

Analyze the trends in their water intake, sleep, nutrition (calories and macros), tasks completed, and budget (income vs expenses).
Pay special attention to the new granular data provided:
- \`water_logs\`: detailed logs with timestamps
- \`sleep_bedtime\` and \`sleep_waketime\`: exact times the user went to sleep and woke up. Identify the user's most common sleep windows (e.g. 11:00 PM to 7:00 AM) and summarize their most slept times.
- \`transaction_type\`: differentiates between 'income' and 'expense' in the transactions array
- \`tasks\`: planner tasks completed vs pending
- \`target_config\`: user's macro nutrient targets

Output the report in crisp, beautiful Markdown with the following sections:
1. **Executive Summary**: A quick, punchy 2-sentence summary of how they did over the last 14 days. Use an encouraging tone.
2. **📈 Fitness & Health Trends**: Analyze their sleep patterns (specifically their most common sleep window based on bedtimes/waketimes), hydration timings, and nutrition (macros). Call out if they are consistently hitting targets or missing them.
3. **💰 Financial Overview**: Analyze their spending vs income using the transaction types. Are they saving? Did they spend too much on a specific category?
4. **🎯 Nova's Recommendations**: 3 actionable, highly specific tips to improve over the next 14 days based on the granular data.

LANGUAGE PREFERENCE:
The user has set their language preference to '${preferredLanguage || 'en'}'. If 'te', you MUST output the entire report in fluent, modern Telugu. Translate all technical fitness and financial terms naturally to Telugu, or use transliteration where it makes sense. If 'en', respond in English. Never deviate from this language preference.

CRITICAL OUTPUT INTEGRITY RULES:
1. REPETITIVE-OUTPUT PREVENTION: Generate each phrase/token only once. Do not progressively re-output previously generated sentences. If a loop is detected, abort it. Never concatenate drafts.
2. NO HYPHENS: Do NOT use hyphens ("-") as bullet points or stylistic dividers. Use standard spacing or numbers.

Use emojis tastefully. Do NOT output any generic AI filler (like "Here is your report"). Just output the raw Markdown starting with a nice Title (e.g., "# 📊 Bi-Weekly Progress Report").`;

        try {
            const response = await orchestrator.generateContent({
                systemInstruction: systemInstruction,
                prompt: `Here is my data for the last 14 days:\n\n${JSON.stringify(historicalData, null, 2)}`,
                temperature: 0.7,
                maxOutputTokens: 1500
            });

            if (response.text) {
                return NextResponse.json({ report: response.text });
            } else {
                return NextResponse.json({ error: `LLM Returned Empty Content` }, { status: 500 });
            }
        } catch (err: any) {
            console.error('Report API Orchestrator call failed:', err);
            return NextResponse.json({ error: `Orchestrator error: ${err.message}` }, { status: 500 });
        }
    } catch (error: any) {
        const errorId = `ORCH-${Math.floor(1000 + Math.random() * 9000)}`;
        console.error(`[${errorId}] Fatal Request Error in Report API:`, error.stack || error);
        return NextResponse.json({ error: `Request failed. Error ID: ${errorId}` }, { status: 500 });
    }
}
