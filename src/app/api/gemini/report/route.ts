import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { historicalData, userProfile } = body;

        const apiKey = process.env.GEMINI_API_KEY;

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

Use emojis tastefully. Do NOT output any generic AI filler (like "Here is your report"). Just output the raw Markdown starting with a nice Title (e.g., "# 📊 Bi-Weekly Progress Report").`;

        if (apiKey) {
            try {
                const modelVersion = process.env.GEMINI_MODEL_VERSION || 'gemini-3.6-flash';
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: systemInstruction }]
                        },
                        contents: [{
                            role: 'user',
                            parts: [{ text: `Here is my data for the last 14 days:\n\n${JSON.stringify(historicalData, null, 2)}` }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1500
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;

                    if (text) {
                        return NextResponse.json({ report: text });
                    }
                } else {
                    const errorData = await response.text();
                    console.error('Gemini API Error:', errorData);
                    return NextResponse.json({ error: `Gemini API Error: ${errorData}` }, { status: response.status });
                }
            } catch (err) {
                console.error('Gemini API call failed:', err);
                return NextResponse.json({ error: 'Network error connecting to Gemini.' }, { status: 500 });
            }
        }

        // Fallback if no API key
        const fallbackReport = `# 📊 Bi-Weekly Progress Report
        
**Executive Summary:** You've had a solid two weeks! While your nutrition has been on point, your sleep could use a bit more consistency to maximize recovery.

### 📈 Fitness & Health Trends
* **Sleep:** Averaging ~6.5 hours. Try to push this closer to 7.5 for your muscle-building goals.
* **Hydration:** Excellent consistency, hitting above 2.5L most days.
* **Nutrition:** You've stayed within a 200 calorie variance of your goal. Great discipline!

### 💰 Financial Overview
* Your income tracked steadily, but you had a spike in "Supplements" spending this week. 
* Overall, you maintained a positive savings rate.

### 🎯 Nova's Recommendations
1. **Prioritize Wind-Down:** Set an alarm 30 mins before bed to stop screen time and improve sleep quality.
2. **Bulk Buy Protein:** To reduce supplement costs, consider buying whey in larger bulk tubs next time.
3. **Progressive Overload:** You've been consistent. Try increasing the weight on your compound lifts by 5% next week.

*(Powered by Nova Offline Fallback)*`;

        return NextResponse.json({ report: fallbackReport });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
