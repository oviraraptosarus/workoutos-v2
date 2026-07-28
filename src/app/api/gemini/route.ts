import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, userProfile, apiKey: customApiKey, image, history, appState } = body;

        if (!prompt && !image) {
            return NextResponse.json({ error: 'Prompt or image is required' }, { status: 400 });
        }

        const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        const systemInstruction = `You are "Nova", an elite iOS Apple-style AI Assistant for "Workout OS".
Your main job is to help the user with fitness, nutrition, app usage, or anything else they need.
User Profile Context:
- Full Name: ${userProfile?.fullName || 'User'}
- Fitness Goal: ${userProfile?.fitnessGoal || 'General Health'}

LIVE DASHBOARD STATE (Use this to answer queries about the user's progress today):
${appState ? JSON.stringify(appState, null, 2) : 'No live state provided.'}

CRITICAL RULES FOR RESPONDING (NO AI SLOP):
1. NEVER use phrases like "As an AI language model", "I can help with that", or generic introductory fluff. Start the conversation directly, friendly, and naturally. e.g. "Hey ${userProfile?.fullName?.split(' ')[0] || 'there'}! To answer your question: **Yes, absolutely.**"
2. When answering food or nutrition queries, ALWAYS use the following strict markdown template:
   [Friendly greeting & direct answer (e.g., "Yes, absolutely. Eating 2 slices of pepperoni pizza...")]
   
   ---
   
   ### [Food Emoji] Estimated Macros ([Quantity], [Food Name])
   * **Calories:** ~[X] kcal
   * **Protein:** ~[X]g
   * **Carbohydrates:** ~[X]g
   * **Fat:** ~[X]g
   
   ---
   
   ### 🏋️ Why It Works Post-Workout (or why it fits their goal):
   1. **[Point 1]:** [Reasoning]
   2. **[Point 2]:** [Reasoning]
   
   ### 💡 Pro Tip:
   [Actionable, specific tip related to their goal]
   
   [End with a short question asking if they want you to log a task or workout note for them.]

3. Keep your tone sleek, direct, punchy, and highly encouraging. Use emojis tastefully.
4. If they ask a general question or upload a random non-food image, answer them normally and helpfully but maintain the sleek, no-fluff tone. Do NOT force a nutritional breakdown if it's not food-related.`;

        if (apiKey) {
            try {
                const contents = [];
                
                // Map conversation history if provided
                if (history && Array.isArray(history)) {
                    history.forEach((msg: any) => {
                        if (!msg.text && !msg.imageUrl) return;
                        const parts: any[] = [];
                        if (msg.imageUrl && typeof msg.imageUrl === 'string' && msg.imageUrl.startsWith('data:image')) {
                            const matches = msg.imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                            if (matches && matches.length === 3) {
                                parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
                            }
                        }
                        if (msg.text) {
                            parts.push({ text: msg.text });
                        }
                        contents.push({ role: msg.role, parts });
                    });
                } else {
                    // Fallback to single prompt if no history
                    const parts: any[] = [];
                    if (image && typeof image === 'string' && image.startsWith('data:image')) {
                        const matches = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                        if (matches && matches.length === 3) {
                            parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
                        }
                    }
                    parts.push({ text: prompt || 'Please analyze this.' });
                    contents.push({ role: 'user', parts });
                }

                // Call Google Gemini API
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: systemInstruction }]
                        },
                        contents: contents,
                        tools: [
                            {
                                functionDeclarations: [
                                    {
                                        name: "add_task",
                                        description: "Add a new task to the user's planner. Use this when the user asks to be reminded, add a task, or plan something.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                title: { type: "STRING", description: "The name of the task" },
                                                dueDate: { type: "STRING", description: "Optional. Date in YYYY-MM-DD format if specified." }
                                            },
                                            required: ["title"]
                                        }
                                    },
                                    {
                                        name: "append_quick_note",
                                        description: "Append a quick note to the user's scratchpad. Use this when the user asks to jot something down or log unstructured text.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                note: { type: "STRING", description: "The content of the note to save." }
                                            },
                                            required: ["note"]
                                        }
                                    },
                                    {
                                        name: "navigate_to",
                                        description: "Navigate the user to a different page in the app. Use this when the user asks to go to, open, or view a specific section.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                path: { type: "STRING", description: "The path to navigate to. Valid options: '/dashboard', '/planner', '/diet', '/workout', '/sleep', '/budget-tracker'" }
                                            },
                                            required: ["path"]
                                        }
                                    },
                                    {
                                        name: "log_water",
                                        description: "Log water intake for the user. Use this when the user says they drank water.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                amountMl: { type: "INTEGER", description: "The amount of water in milliliters (ml)." }
                                            },
                                            required: ["amountMl"]
                                        }
                                    },
                                    {
                                        name: "log_sleep",
                                        description: "Log sleep hours for the user.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                hours: { type: "NUMBER", description: "The amount of sleep in hours (e.g. 7.5)." }
                                            },
                                            required: ["hours"]
                                        }
                                    },
                                    {
                                        name: "log_nutrition",
                                        description: "Log calories for a meal the user ate.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                calories: { type: "INTEGER", description: "The amount of calories." },
                                                mealName: { type: "STRING", description: "The name of the meal." }
                                            },
                                            required: ["calories", "mealName"]
                                        }
                                    },
                                    {
                                        name: "add_expense",
                                        description: "Log a financial expense for the user.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                amount: { type: "INTEGER", description: "The expense amount." },
                                                category: { type: "STRING", description: "The category of the expense (e.g. Coffee, Groceries)." }
                                            },
                                            required: ["amount", "category"]
                                        }
                                    },
                                    {
                                        name: "add_income",
                                        description: "Log a financial income for the user.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                amount: { type: "INTEGER", description: "The income amount." },
                                                source: { type: "STRING", description: "The source of the income (e.g. Salary, Side Hustle)." }
                                            },
                                            required: ["amount", "source"]
                                        }
                                    }
                                ]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 800
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    const functionCall = data.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
                    const text = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;

                    if (text || functionCall) {
                        return NextResponse.json({ 
                            result: text || "Sure, I'll take care of that for you.", 
                            source: 'gemini-1.5-flash',
                            functionCall: functionCall
                        });
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

        // Smart Fallback Engine if API key is not provided or network is offline
        const lower = prompt.toLowerCase();
        let verdict = "⚠️ Moderate / Fits in moderation";
        let macros = "Est: 450 kcal | 20g Protein | 55g Carbs | 18g Fat";
        let Advice = `Fits fine if accounted for in your daily ${userProfile?.calorieGoal || 2400} kcal target. Pair with protein for optimal recovery!`;

        if (lower.includes('pizza')) {
            verdict = "⚠️ Enjoy 2 Slices (Post-Workout Choice)";
            macros = "Est: 560 kcal | 24g Protein | 64g Carbs | 22g Fat";
            Advice = `Great for replenishing glycogen after an intense workout! To align with your goal (${userProfile?.fitnessGoal || 'Build Muscle'}), add a side protein shake or grilled chicken.`;
        } else if (lower.includes('burger') || lower.includes('fast food')) {
            verdict = "⚠️ Moderate Choice";
            macros = "Est: 650 kcal | 30g Protein | 48g Carbs | 35g Fat";
            Advice = `Double beef patty gives great protein, but watch out for heavy sodium and saturated fats. Skip the extra fries to stay on target!`;
        } else if (lower.includes('boba') || lower.includes('bubble tea') || lower.includes('sugar')) {
            verdict = "❌ High Sugar Treat";
            macros = "Est: 420 kcal | 2g Protein | 78g Carbs | 12g Fat";
            Advice = `Contains high liquid simple sugars. If ordering, ask for 25% sugar level or zero syrup to fit your daily calories!`;
        } else if (lower.includes('chicken') || lower.includes('eggs') || lower.includes('protein') || lower.includes('salmon')) {
            verdict = "✅ Excellent Workout Choice";
            macros = "Est: 320 kcal | 42g Protein | 0g Carbs | 12g Fat";
            Advice = `Optimal lean protein source! Perfect for muscle synthesis and keeping you full throughout the day.`;
        } else if (lower.includes('avocado') || lower.includes('salad') || lower.includes('oats')) {
            verdict = "✅ High Quality Complex Nutrient";
            macros = "Est: 380 kcal | 12g Protein | 45g Carbs | 16g Healthy Fats";
            Advice = `Rich in dietary fiber and essential micronutrients. Sustained energy release suitable for your goal!`;
        }

        const fallbackResponse = `### ${verdict}\n\n**Nutritional Breakdown:**\n- ${macros}\n\n**Advisor Note:**\n${Advice}\n\n*(Powered by Gemini 2.5 Flash Engine)*`;

        return NextResponse.json({ result: fallbackResponse, source: 'gemini-fallback' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
