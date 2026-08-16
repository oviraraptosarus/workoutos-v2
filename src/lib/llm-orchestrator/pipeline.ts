import { orchestrator } from "./Orchestrator";

// Fast classifier to determine which domains of appState to keep
export async function classifyIntentAndContext(prompt: string, image?: string): Promise<{ intent: string, domains: string[] }> {
  const schema = {
    type: "object",
    properties: {
      intent: { type: "string", description: "COACHING, ANALYSIS, LOGGING, RETRIEVAL, CREATION, or GENERAL" },
      domains: {
        type: "array",
        items: { type: "string" },
        description: "List of relevant domains: 'Tasks', 'Workout', 'Nutrition', 'Sleep', 'Budget', 'Habits', 'Dashboard'"
      }
    },
    required: ["intent", "domains"]
  };

  const sysPrompt = `Classify the user's request intent and required context domains.
Available Domains: Tasks, Workout, Nutrition, Sleep, Budget, Habits, Dashboard.
Intent types (in priority order): 
- COACHING (e.g. 'make me a workout', 'give me a diet plan', 'design a training program', 'what exercises for chest', 'create a HIIT plan', 'meal plan for cutting', 'what should I eat', 'help me lose weight', 'build me a routine', 'training plan with dumbells'). This is for ANY request where the user wants expert fitness/nutrition guidance, a structured plan, or a program designed for them.
- ANALYSIS (e.g. 'is this healthy', 'how many calories', 'rate this food', 'is this good for my goals')
- LOGGING (e.g. 'log this meal', 'I ran 5 miles', 'I slept 7 hours', 'add this to lunch')
- RETRIEVAL (e.g. 'did I sleep well', 'what did I eat yesterday', 'show my progress')
- CREATION (e.g. 'remind me', 'create task', 'add to my to-do list', 'schedule', 'set a reminder'). IMPORTANT: This is ONLY for explicit task/reminder/to-do creation. Requests like 'make me a plan' or 'create a workout' are COACHING, not CREATION.
- GENERAL (e.g. 'hi', 'what is progressive overload', 'motivate me')

Output ONLY valid JSON matching this schema: ${JSON.stringify(schema)}`;

  try {
    const res = await orchestrator.generateContent({
      requestId: "classification",
      systemInstruction: sysPrompt,
      prompt: prompt || (image ? "Image uploaded" : "Hello"),
      history: [],
      temperature: 0.1,
      maxOutputTokens: 200,
    });
    
    // Attempt to parse JSON from the text
    const text = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    return {
      intent: parsed.intent || "GENERAL",
      domains: parsed.domains || ["Dashboard"]
    };
  } catch (err) {
    console.warn("Intent classification failed, defaulting to full context", err);
    return { intent: "GENERAL", domains: ["Tasks", "Workout", "Nutrition", "Sleep", "Budget", "Habits", "Dashboard"] };
  }
}

export function filterAppState(appState: any, domains: string[]) {
  if (!appState) return null;
  const filtered: any = {};
  
  if (domains.includes("Tasks")) {
    filtered.tasks = appState.tasks;
    filtered.execGoals = appState.macroGoals;
    filtered.taskScores = appState.taskScores;
  }
  if (domains.includes("Workout")) {
    filtered.workout = appState.workout;
  }
  if (domains.includes("Nutrition")) {
    filtered.nutrition = appState.nutrition;
  }
  if (domains.includes("Sleep")) {
    filtered.sleep = appState.sleep;
  }
  if (domains.includes("Budget")) {
    filtered.budget = appState.budget;
  }
  if (domains.includes("Habits")) {
    filtered.habits = appState.habits;
  }
  if (domains.includes("Dashboard")) {
    filtered.commandCenter = appState.commandCenter;
  }
  
  return filtered;
}
