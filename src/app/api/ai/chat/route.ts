import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/llm-orchestrator/Orchestrator';
import { telemetryEngine } from '@/services/telemetryEngine';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, requestId: clientRequestId, userProfile, image, history, appState, preferredLanguage, aiMemories, currentDateTime, devMode } = body;
        const requestId = clientRequestId || telemetryEngine.generateRequestId();

        telemetryEngine.logEvent({
            user_id: userProfile?.id || 'anonymous',
            request_id: requestId,
            event_type: 'PROMPT_RECEIVED',
            module: 'AI Orchestrator',
            payload: { prompt, hasImage: !!image },
            status: 'INFO'
        });

        if (!prompt && !image) {
            telemetryEngine.logEvent({ user_id: userProfile?.id, request_id: requestId, event_type: 'ERROR', module: 'AI Orchestrator', status: 'FAILED', payload: { error: 'No prompt or image' } });
            return NextResponse.json({ error: 'Prompt or image is required', requestId }, { status: 400 });
        }

        const hasAnyKey = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        if (!hasAnyKey) {
            telemetryEngine.logEvent({ user_id: userProfile?.id, request_id: requestId, event_type: 'ERROR', module: 'AI Orchestrator', status: 'FAILED', payload: { error: 'No API Keys Configured' } });
            return NextResponse.json({ error: 'No AI API Keys are configured on the server', requestId }, { status: 500 });
        }

        const systemInstruction = `You are the central intelligence of "Workout OS", functioning as a stateful Execution OS. You operate using a Tri-Persona architecture (Planner, Coach, Analyst). You automatically adopt the persona most appropriate for the user's current request.

CURRENT DATE & TIME: ${currentDateTime || new Date().toLocaleString()}

USER PROFILE:
Name: ${userProfile?.fullName || 'User'}
Goal: ${userProfile?.fitnessGoal || 'General Health'}

LONG-TERM MEMORY (Crucial details & Behavioral Patterns):
${aiMemories && aiMemories.length > 0 ? aiMemories.map((m: any) => `- [${m.category}] ${m.memory_text}`).join('\n') : 'No long-term memories saved yet.'}

LIVE APP STATE (OS state & Execution Budgets):
${appState ? JSON.stringify(appState, null, 2) : 'No live state provided.'}

=== PERSONA ARCHITECTURE ===
1. THE PLANNER: Your job is to schedule, prioritize, and manage the user's Execution Budget (max 100 points/day). Break down overwhelming tasks. If a user asks to plan, you ruthlessly optimize for high Execution Probability.
2. THE COACH: Your job is to motivate, review, and notice behavioral patterns. If you notice a pattern (e.g. procrastinates in the evening), use the save_ai_memory tool to log it as a Behavior Pattern.
3. THE ANALYST: Your job is to generate insights, predict burnout, and find bottlenecks in the user's execution rate.

=== CRITICAL RULES ===
RULE 1 — ZERO FRICTION LOGGING: Never interrogate the user. If they want to log a meal, task, or reminder, execute the tool immediately using reasonable defaults.
RULE 2 — EXECUTION BUDGET: The user only has a limited execution budget each day. When adding tasks, prioritize them effectively and warn the user if they are overloading their schedule.
RULE 3 — NO AI SLOP: Never say "As an AI", "Certainly!", etc. Start directly.
RULE 4 — TONE: Sleek, direct, punchy, ruthless execution-focused.
RULE 5 — IMAGE TASK EXTRACTION: Extract actionable tasks from images and call add_task.
RULE 6 — LONG-TERM MEMORY: Whenever the user reveals a permanent fact or behavioral pattern, call save_ai_memory.
RULE 7 — EXECUTIVE ASSISTANT: If asked "What should I do next?", analyze the LIVE APP STATE across tasks, workouts, sleep, and habits to recommend the single HIGHEST-VALUE NEXT ACTION.
RULE 8 — TIMELINE BUCKETING (BRAIN DUMP): When a user brain-dumps multiple tasks, automatically assign them logical due dates (Today, Tomorrow, This Week) instead of cramming them into today.

=== END RULES ===`;

        if (hasAnyKey) {
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
                    requestId,
                    systemInstruction,
                    prompt: currentPromptObj?.text || prompt,
                    history: mappedHistory,
                    image,
                    tools: [
                        {
                            functionDeclarations: [
                                {
                                    name: "add_task",
                                    description: "Add a new task to the user's planner. Extract tasks from text or images.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            title: { type: "STRING", description: "A short, concise title for the task (max 3-5 words)." },
                                            fullTitle: { type: "STRING", description: "The complete, detailed title or full text of the task." },
                                            description: { type: "STRING", description: "Any additional details, notes, or context." },
                                            dueDate: { type: "STRING", description: "Optional. Date in YYYY-MM-DD format." },
                                            dueTime: { type: "STRING", description: "Optional. Time in HH:MM format." },
                                            priority: { type: "STRING", description: "Optional. 'high', 'medium', 'low', or 'none'. Defaults to 'none'." },
                                            reminderTime: { type: "STRING", description: "Optional. ISO 8601 timestamp string for when to remind the user." },
                                            executionProbability: { type: "NUMBER", description: "Execution OS V3: AI's confidence (0-100) that the user will complete this task based on their momentum and behavior patterns." },
                                            energyCost: { type: "NUMBER", description: "Execution OS V3: How many Execution Budget points (1-100) this task requires. Default 10 for normal, 5 for micro, 30 for hard." }
                                        },
                                        required: ["title", "fullTitle"]
                                    }
                                },
                                {
                                    name: "breakdown_task",
                                    description: "Break a large task into smaller micro-tasks (Execution OS V3). Use this when a user is overwhelmed or a task's execution probability is low.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            parentTaskId: { type: "STRING", description: "The UUID of the parent task being broken down." },
                                            microTasks: { 
                                                type: "ARRAY", 
                                                items: { type: "STRING" },
                                                description: "List of actionable 5-15 minute micro-tasks."
                                            }
                                        },
                                        required: ["parentTaskId", "microTasks"]
                                    }
                                },
                                {
                                    name: "add_reminder",
                                    description: "Create a generic reminder (e.g. 'Remind me to drink water', 'Remind me to stretch every day at 3pm'). Use this when the user wants to be notified about an activity.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            type: { type: "STRING", description: "Category/type of reminder (e.g. 'Water', 'Workout', 'Meal', 'Sleep', 'Custom')." },
                                            title: { type: "STRING", description: "Title of the reminder (e.g. 'Drink water!')." },
                                            time: { type: "STRING", description: "Time of the reminder in HH:MM format (24-hour). If not specified, leave blank." },
                                            repeat: { type: "BOOLEAN", description: "Whether it repeats daily." },
                                            days: { type: "ARRAY", items: { type: "NUMBER" }, description: "Array of weekdays (0-6, 0=Sun). If everyday, use [0,1,2,3,4,5,6]." },
                                            snooze_duration: { type: "NUMBER", description: "Snooze duration in minutes. Default 10." },
                                            smart_detection: { type: "BOOLEAN", description: "If true, it won't fire if the user already logged the activity." }
                                        },
                                        required: ["type", "title"]
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
                                    name: "log_workout",
                                    description: "Log a workout or cardio activity. Use when the user states they completed an exercise (e.g., 'I walked 10000 steps', 'I ran for 30 minutes'). If they don't provide the duration, ASK for it before logging. Do NOT guess or hallucinate the duration. For walking/running, assume 100 steps per minute if duration is missing and you must calculate it, but asking is better.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            activityType: { type: "STRING", description: "Must be 'Stationary Bike', 'Running', 'Walking', 'Swimming', 'Rowing', 'Elliptical', or 'Other'." },
                                            customName: { type: "STRING", description: "If activityType is 'Other', the name of the activity (e.g., 'HIIT', 'Pickleball')." },
                                            durationMinutes: { type: "NUMBER", description: "Duration in minutes. If unknown, ask the user." },
                                            intensity: { type: "STRING", description: "Must be 'Light', 'Moderate', or 'Vigorous'. Default to 'Moderate'." },
                                            metricValue: { type: "NUMBER", description: "Numeric metric value (e.g., 10000 for steps, 30 for laps)." },
                                            metricLabel: { type: "STRING", description: "Label for the metric (e.g., 'Steps', 'Laps', 'Avg Cadence (RPM)')." }
                                        },
                                        required: ["activityType"]
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
                                },
                                {
                                    name: "save_ai_memory",
                                    description: "Save a permanent fact about the user for true long-term memory (e.g., fitness goals, diet, allergies, habits).",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            category: { type: "STRING", description: "Category of the memory (e.g. 'Fitness Goals', 'Diet Preferences', 'Medical Limitations', 'Sleep Schedule', 'General Profile')." },
                                            memory_text: { type: "STRING", description: "The specific fact to remember (e.g. 'User is allergic to peanuts', 'User prefers to workout in the morning')." }
                                        },
                                        required: ["category", "memory_text"]
                                    }
                                },
                                {
                                    name: "log_behavior_pattern",
                                    description: "Execution OS V3 (Analyst/Coach Persona): Record a behavioral pattern about the user's execution style (e.g., procrastinates large tasks, skips leg day, high momentum in mornings).",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            pattern_description: { type: "STRING", description: "The specific behavior pattern observed." },
                                            confidence_score: { type: "NUMBER", description: "AI's confidence in this pattern (0-100)." }
                                        },
                                        required: ["pattern_description", "confidence_score"]
                                    }
                                }
                            ]
                        }
                    ],
                    temperature: 0.7,
                    maxOutputTokens: 800
                });

                if (response.text || response.functionCall) {
                    telemetryEngine.logEvent({ user_id: userProfile?.id, request_id: requestId, event_type: 'ORCHESTRATOR_RESPONSE', module: 'AI Orchestrator', status: 'SUCCESS', payload: { source: response.sourceModel, hasFunction: !!response.functionCall, functionName: response.functionCall?.name, latencyMs: response.latencyMs }, latency_ms: response.latencyMs });
                    return NextResponse.json({
                        result: response.text || "Done.",
                        source: response.sourceModel,
                        functionCall: response.functionCall,
                        requestId
                    });
                } else {
                    telemetryEngine.logEvent({ user_id: userProfile?.id, request_id: requestId, event_type: 'ORCHESTRATOR_RESPONSE', module: 'AI Orchestrator', status: 'FAILED', payload: { error: 'Empty Content' } });
                    return NextResponse.json({ error: 'LLM Returned Empty Content', requestId }, { status: 500 });
                }
            } catch (err: any) {
                console.error('Orchestrator API call failed:', err);
                telemetryEngine.logEvent({ user_id: userProfile?.id, request_id: requestId, event_type: 'ERROR', module: 'AI Orchestrator', status: 'FAILED', payload: { error: err.message, stack: err.stack } });
                return NextResponse.json({ error: `Orchestrator error: ${err.message}`, requestId, devDetails: { message: err.message, stack: err.stack } }, { status: 500 });
            }
        }

        // Offline fallback
        const lower = prompt.toLowerCase();
        let verdict = "మితమైన ఎంపిక / మితంగా తీసుకోవచ్చు";
        let macros = "అంచనా: 450 kcal | 20g ప్రోటీన్ | 55g కార్బ్స్ | 18g కొవ్వు";
        let advice = `మీ రోజువారీ ${userProfile?.calorieGoal || 2400} kcal లక్ష్యంలో భాగమైతే ఇది మంచిదే. మెరుగైన రికవరీ కోసం ప్రోటీన్‌తో కలిపి తీసుకోండి!`;

        if (lower.includes('pizza') || lower.includes('పిజ్జా')) {
            verdict = "2 ముక్కలు ఆస్వాదించండి (వ్యాయామం తర్వాత మంచిది)";
            macros = "అంచనా: 560 kcal | 24g ప్రోటీన్ | 64g కార్బ్స్ | 22g కొవ్వు";
            advice = `తీవ్రమైన వ్యాయామం తర్వాత గ్లైకోజెన్‌ను తిరిగి నింపడానికి అద్భుతమైనది! మీ లక్ష్యానికి (${userProfile?.fitnessGoal || 'కండరాల నిర్మాణం'}) అనుగుణంగా ఉండటానికి, ప్రోటీన్ షేక్ లేదా గ్రిల్ చేసిన చికెన్‌ను జోడించండి.`;
        } else if (lower.includes('burger') || lower.includes('fast food') || lower.includes('బర్గర్')) {
            verdict = "మితమైన ఎంపిక";
            macros = "అంచనా: 650 kcal | 30g ప్రోటీన్ | 48g కార్బ్స్ | 35g కొవ్వు";
            advice = `డబుల్ బీఫ్ ప్యాటీ మంచి ప్రోటీన్‌ను ఇస్తుంది, కానీ అధిక సోడియం మరియు కొవ్వుల పట్ల జాగ్రత్తగా ఉండండి. మీ లక్ష్యంలో ఉండటానికి అదనపు ఫ్రైస్‌ను దాటవేయండి!`;
        } else if (lower.includes('chicken') || lower.includes('eggs') || lower.includes('protein') || lower.includes('salmon') || lower.includes('చికెన్') || lower.includes('గుడ్లు')) {
            verdict = "వ్యాయామానికి అద్భుతమైన ఎంపిక";
            macros = "అంచనా: 320 kcal | 42g ప్రోటీన్ | 0g కార్బ్స్ | 12g కొవ్వు";
            advice = `అత్యుత్తమ లీన్ ప్రోటీన్ మూలం! కండరాల నిర్మాణానికి మరియు రోజంతా కడుపు నిండినట్లు అనిపించడానికి పర్ఫెక్ట్.`;
        }

        const fallbackResponse = `### ${verdict}\n\n**పోషకాల వివరాలు:**\n• ${macros}\n\n**సలహాదారు గమనిక:**\n${advice}`;
    } catch (error: any) {
        const errorId = `ORCH-${Math.floor(1000 + Math.random() * 9000)}`;
        let requestId = "UNKNOWN";
        let devMode = false;

        try {
            // We can parse it from req if we hadn't consumed it, but since it's already consumed, 
            // we will just assume devMode might be false unless we can tell otherwise.
            // But wait, we can't reliably read it.
        } catch (e) {}

        console.error(`[${errorId}] Fatal Request Error in Chat API:`, error.stack || error);
        
        return NextResponse.json({ 
            error: `Request failed. Error ID: ${errorId}`, 
            requestId,
            devDetails: { message: error.message, stack: error.stack }
        }, { status: 500 });
    }
}
