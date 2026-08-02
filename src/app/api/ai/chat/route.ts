import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/llm-orchestrator/Orchestrator';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, userProfile, image, history, appState, preferredLanguage } = body;

        if (!prompt && !image) {
            return NextResponse.json({ error: 'Prompt or image is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY environment variable is not set' }, { status: 500 });
        }

        const systemInstruction = `You are "Ava", an elite AI health and fitness assistant inside "Workout OS". You are friendly, concise, direct, and speak like a knowledgeable coach — not a robot.

USER PROFILE:
Name: ${userProfile?.fullName || 'User'}
Goal: ${userProfile?.fitnessGoal || 'General Health'}
Calorie Target: ${userProfile?.calorieGoal || 'Not set'} kcal/day
Sleep Goal: ${userProfile?.sleepGoal || 7.5} hrs/night
Water Goal: ${userProfile?.waterGoalMl || 2500} ml/day

LIVE DASHBOARD STATE (today's data — use this to answer progress questions):
${appState ? JSON.stringify(appState, null, 2) : 'No live state provided.'}

=== CRITICAL RULES — FOLLOW THESE EXACTLY ===

RULE 1 — CLARIFICATION BEFORE LOGGING (MOST IMPORTANT):
Before calling ANY logging function (log_nutrition, log_sleep, log_water, add_expense, add_income), you MUST have all required details. If the user's message is vague or incomplete, ask a SHORT clarifying question instead of calling the function with guessed/zero values. Examples:
  User: "log my lunch" → Ask: "What did you have for lunch and roughly how much?"
  User: "I ate something" → Ask: "What did you eat? Rough portion size works too!"
  User: "log sleep" or "log my night" or "I slept" with no details → Ask in ONE message for all sleep details:
    Ask: "Quick sleep check-in! Tell me: what time did you sleep and wake up, how would you rate the quality (excellent/good/fair/poor), waking mood (great/good/okay/groggy), energy (high/medium/low), stress (low/moderate/high), and any notes or dreams?"
  User: "I slept at 11 and woke at 6" → You have bedtime/waketime. Still ask quality, mood, energy, stress before logging.
  User: "slept at 11, woke at 6, quality was good, mood good, energy medium, stress low" → Call log_sleep with all fields now.
  User: "I slept 7 hours, felt great, energy was high" → Call log_sleep with hours:7, quality:"good", mood:"great", energy:"high", stress:"low"
  User: "log 500ml water" → You have enough — call log_water immediately
  User: "I had 2 chapatis and dal for lunch" → Estimate macros and call log_nutrition with mealName, category:Lunch, calories, protein, carbs, fat
  User: "log lunch" or "log breakfast" with nothing else → Ask: "What did you have? Tell me the food and rough amount and I'll log it with full macros!"
  User: "I ate rice" → Ask: "How much rice roughly, and was there anything else with it (dal, sabzi, etc)? Which meal — lunch or dinner?"
  User: "log my weight" or "log weight" → Ask: "What's your weight today?"
  User: "log my end of day reflection" or "end of day" or "EOD log" → Respond with a warm check-in asking: "Let's do your end-of-day check-in! Tell me: overall mood today (great/good/okay/bad), energy level (high/medium/low), stress (low/moderate/high), and optionally your journal thoughts, wins, or what you're grateful for. I'll navigate you to the reflection page too!" Then call navigate_to with path "/sleep".
  User: "I spent 200 on coffee" → Call add_expense immediately

RULE 2 — NO DASHES IN RESPONSES:
Never use " - " as a separator or list bullet. Use bullet points (•), numbered lists, or plain sentences instead. Never write "something - explanation" patterns.

RULE 3 — NO AI SLOP:
Never say "As an AI", "I can help with that", "Certainly!", "Of course!", "Sure thing!" or any generic filler opener. Start responses directly and naturally. For example: "You had about 450 kcal there! Here's the breakdown..." or "Got it — logging that now."

RULE 4 — NUTRITION RESPONSE FORMAT:
When answering food or nutrition queries (not logging — just answering), use this format:
[Friendly direct answer]

### [Food Emoji] Estimated Macros — [Quantity] [Food Name]
• Calories: ~[X] kcal
• Protein: ~[X]g
• Carbs: ~[X]g
• Fat: ~[X]g

### 🏋️ Why it works (or fits your goal):
1. [Point 1]
2. [Point 2]

### 💡 Pro Tip:
[Actionable tip related to their goal]

[End with a short question asking if they want to log it.]

RULE 5 — TONE:
Sleek, direct, punchy, encouraging. Use emojis tastefully. Keep responses short unless detail is genuinely needed.

RULE 6 — AFTER SUCCESSFUL LOGGING:
After calling a function to log data, confirm briefly. Example: "Logged! 2 chapatis + dal added to your lunch — about 420 kcal, 14g protein."

RULE 7 — LANGUAGE:
The user has set their language preference to '${preferredLanguage || 'en'}'. If 'te', you MUST respond entirely in fluent, modern Telugu. Translate all technical fitness and financial terms naturally to Telugu, or use transliteration where it makes sense. If 'en', respond in English. Never deviate from this language preference.

=== END RULES ===`;

        if (apiKey) {
            try {
                const contents: any[] = [];

                if (Array.isArray(history) && history.length > 0) {
                    history.forEach((msg: any) => {
                        if (!msg || (!msg.text && !msg.imageUrl)) return;
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
                        if (parts.length > 0) {
                            const role = (msg.role === 'model' || msg.role === 'ava' || msg.role === 'assistant') ? 'model' : 'user';
                            contents.push({ role, parts });
                        }
                    });
                }

                const currentParts: any[] = [];
                if (image && typeof image === 'string' && image.startsWith('data:image')) {
                    const matches = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        currentParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
                    }
                }
                if (prompt) {
                    currentParts.push({ text: prompt });
                }

                if (currentParts.length > 0) {
                    const lastContent = contents[contents.length - 1];
                    const isDuplicate = lastContent && lastContent.role === 'user' &&
                        lastContent.parts.some((p: any) => p.text === prompt);
                    if (!isDuplicate) {
                        contents.push({ role: 'user', parts: currentParts });
                    }
                }

                if (contents.length === 0) {
                    contents.push({ role: 'user', parts: [{ text: prompt || 'Hello' }] });
                }

                const mappedHistory = contents.map(c => ({
                    role: c.role as 'user' | 'model',
                    text: c.parts.map((p: any) => p.text).join('\n') || ''
                }));
                const currentPromptObj = mappedHistory.pop();

                const response = await orchestrator.generateContent({
                    systemInstruction,
                    prompt: currentPromptObj?.text || prompt,
                    history: mappedHistory,
                    image,
                    tools: [
                        {
                            functionDeclarations: [
                                {
                                    name: "add_task",
                                    description: "Add a new task to the user's planner. Use when the user asks to be reminded, add a task, or plan something.",
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
                                    description: "Append a quick note to the user's scratchpad. Use when the user asks to jot something down or log unstructured text.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            text: { type: "STRING", description: "The content of the note to save." }
                                        },
                                        required: ["text"]
                                    }
                                },
                                {
                                    name: "navigate_to",
                                    description: "Navigate the user to a different page in the app. Use when the user asks to go to, open, or view a specific section.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            path: { type: "STRING", description: "Valid options: '/dashboard', '/planner', '/diet', '/workout', '/sleep', '/budget-tracker'" }
                                        },
                                        required: ["path"]
                                    }
                                },
                                {
                                    name: "log_water",
                                    description: "Log water intake. Use ONLY when the user specifies an amount of water they drank (e.g. '500ml', '2 glasses', '1 litre'). If amount is not mentioned, ask first.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            amount: { type: "INTEGER", description: "Amount of water in milliliters. Convert glasses (1 glass = 250ml) or litres as needed." }
                                        },
                                        required: ["amount"]
                                    }
                                },
                                {
                                    name: "log_sleep",
                                    description: "Log sleep data for the user. Use this immediately when the user tells you how long they slept (e.g. 'I slept 8 hours', 'log 7 hours of sleep') or gives a bedtime/waketime. Do NOT ask for additional details (like mood, energy, or quality) unless they provide it naturally. Log what you have.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            hours: { type: "NUMBER", description: "Total sleep duration in hours. Calculate from bedtime/waketime if both provided." },
                                            bedtime: { type: "STRING", description: "Bedtime in HH:MM 24-hour format (e.g. '23:00' for 11pm, '00:30' for 12:30am)." },
                                            waketime: { type: "STRING", description: "Wake time in HH:MM 24-hour format (e.g. '06:30' for 6:30am)." },
                                            quality: { type: "STRING", description: "Sleep quality. One of: 'excellent', 'good', 'fair', 'poor'. Default 'good' if not mentioned." },
                                            mood: { type: "STRING", description: "Waking mood. One of: 'great', 'good', 'okay', 'groggy'. Default 'good' if not mentioned." },
                                            energy: { type: "STRING", description: "Morning energy level. One of: 'high', 'medium', 'low'. Default 'medium' if not mentioned." },
                                            stress: { type: "STRING", description: "Stress level. One of: 'low', 'moderate', 'high'. Default 'low' if not mentioned." },
                                            notes: { type: "STRING", description: "Any notes about the sleep (e.g. 'had trouble falling asleep', 'woke up once'). Optional." },
                                            dreams: { type: "STRING", description: "Any dream details the user mentioned. Optional." },
                                            tags: { type: "STRING", description: "Comma-separated tags like 'late meal, hot room, stress'. Optional." }
                                        },
                                        required: ["hours"]
                                    }
                                },
                                {
                                    name: "log_nutrition",
                                    description: "Log a meal the user ate. Use ONLY when you know what they ate. If vague (e.g. 'log lunch', 'I ate something'), ask what they ate first. If they describe a food, estimate macros from your knowledge and log it. Always provide protein, carbs, and fat estimates even if approximate.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            mealName: { type: "STRING", description: "Name of the meal or food item (e.g. '2 chapatis with dal', 'Chicken salad')." },
                                            category: { type: "STRING", description: "Meal category. Valid options: 'Breakfast', 'Lunch', 'Snacks', 'Dinner'. Infer from context or default to 'Snacks'." },
                                            calories: { type: "INTEGER", description: "Estimated calories for this meal." },
                                            protein: { type: "NUMBER", description: "Estimated protein in grams." },
                                            carbs: { type: "NUMBER", description: "Estimated carbohydrates in grams." },
                                            fat: { type: "NUMBER", description: "Estimated fat in grams." }
                                        },
                                        required: ["mealName", "calories", "protein", "carbs", "fat"]
                                    }
                                },
                                {
                                    name: "add_expense",
                                    description: "Log a financial expense. Use when the user states an amount and what they spent on. If amount or category is missing, ask first.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            amount: { type: "INTEGER", description: "The expense amount in the user's currency." },
                                            category: { type: "STRING", description: "Category of the expense (e.g. Coffee, Groceries, Transport, Food)." }
                                        },
                                        required: ["amount", "category"]
                                    }
                                },
                                {
                                    name: "add_income",
                                    description: "Log a financial income entry. Use when the user mentions receiving money.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            amount: { type: "INTEGER", description: "The income amount." },
                                            source: { type: "STRING", description: "Source of the income (e.g. Salary, Freelance, Side Hustle)." }
                                        },
                                        required: ["amount", "source"]
                                    }
                                }
                            ]
                        }
                    ],
                    temperature: 0.7,
                    maxOutputTokens: 800
                });

                if (response.text || response.functionCall) {
                    return NextResponse.json({
                        result: response.text || "Done.",
                        source: response.sourceModel,
                        functionCall: response.functionCall
                    });
                } else {
                    return NextResponse.json({ error: 'LLM Returned Empty Content' }, { status: 500 });
                }
            } catch (err: any) {
                console.error('Orchestrator API call failed:', err);
                return NextResponse.json({ error: `Orchestrator error: ${err.message}` }, { status: 500 });
            }
        }

        // Offline fallback
        const lower = prompt.toLowerCase();
        let verdict = "Moderate / Fits in moderation";
        let macros = "Est: 450 kcal | 20g Protein | 55g Carbs | 18g Fat";
        let advice = `Fits fine if accounted for in your daily ${userProfile?.calorieGoal || 2400} kcal target. Pair with protein for optimal recovery!`;

        if (lower.includes('pizza')) {
            verdict = "Enjoy 2 Slices (Post-Workout Choice)";
            macros = "Est: 560 kcal | 24g Protein | 64g Carbs | 22g Fat";
            advice = `Great for replenishing glycogen after an intense workout! To align with your goal (${userProfile?.fitnessGoal || 'Build Muscle'}), add a side protein shake or grilled chicken.`;
        } else if (lower.includes('burger') || lower.includes('fast food')) {
            verdict = "Moderate Choice";
            macros = "Est: 650 kcal | 30g Protein | 48g Carbs | 35g Fat";
            advice = `Double beef patty gives great protein, but watch out for heavy sodium and saturated fats. Skip the extra fries to stay on target!`;
        } else if (lower.includes('chicken') || lower.includes('eggs') || lower.includes('protein') || lower.includes('salmon')) {
            verdict = "Excellent Workout Choice";
            macros = "Est: 320 kcal | 42g Protein | 0g Carbs | 12g Fat";
            advice = `Optimal lean protein source! Perfect for muscle synthesis and keeping you full throughout the day.`;
        }

        const fallbackResponse = `### ${verdict}\n\n**Nutritional Breakdown:**\n• ${macros}\n\n**Advisor Note:**\n${advice}`;
        return NextResponse.json({ result: fallbackResponse, source: 'gemini-fallback' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
