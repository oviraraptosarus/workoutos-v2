export const AVA_TOOLS = [
  {
    name: "add_task",
    description:
      "Add a new task to the user's planner. Extract tasks from text or images. ACTION GATE: Only call if user explicitly asks to 'add', 'remind', 'create task', or 'schedule'.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: {
          type: "STRING",
          description: "A short, concise title for the task (max 3-5 words).",
        },
        fullTitle: {
          type: "STRING",
          description: "The complete, detailed title or full text of the task.",
        },
        description: {
          type: "STRING",
          description: "Any additional details, notes, or context.",
        },
        dueDate: {
          type: "STRING",
          description: "Optional. Date in YYYY-MM-DD format.",
        },
        dueTime: {
          type: "STRING",
          description: "Optional. Time in HH:MM format.",
        },
        priority: {
          type: "STRING",
          description: "Optional. 'high', 'medium', 'low', or 'none'. Defaults to 'none'.",
        },
        reminderTime: {
          type: "STRING",
          description: "ISO 8601 timestamp for reminder.",
        },
      },
      required: ["title", "fullTitle"],
    },
  },
  {
    name: "add_multiple_tasks",
    description:
      "Add multiple new tasks to the user's planner at once. Use specifically when parsing a Brain Dump or explicit multi-task request.",
    parameters: {
      type: "OBJECT",
      properties: {
        tasks: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              fullTitle: { type: "STRING" },
            },
            required: ["title", "fullTitle"],
          },
        },
      },
      required: ["tasks"],
    },
  },
  {
    name: "log_water",
    description:
      "Log water intake. Use this when the user specifies an amount of water or uploads an image of water. Log it automatically.",
    parameters: {
      type: "OBJECT",
      properties: {
        amount: {
          type: "INTEGER",
          description: "Amount of water in milliliters.",
        },
        logDate: {
          type: "STRING",
          description: "The date to log this for in YYYY-MM-DD format.",
        },
      },
      required: ["amount"],
    },
  },
  {
    name: "log_sleep",
    description:
      "Log sleep data for the user. Use this immediately when the user tells you how long they slept.",
    parameters: {
      type: "OBJECT",
      properties: {
        hours: {
          type: "NUMBER",
          description: "Total sleep duration in hours.",
        },
        bedtime: {
          type: "STRING",
          description: "Bedtime in HH:MM 24-hour format (e.g. '23:00' for 11pm, '00:30' for 12:30am).",
        },
        waketime: {
          type: "STRING",
          description: "Wake time in HH:MM 24-hour format (e.g. '06:30' for 6:30am).",
        },
      },
      required: ["hours"],
    },
  },
  {
    name: "log_nutrition",
    description:
      "Log a meal the user ate. ACTION GATE: Use ONLY when you know what they ate AND they explicitly authorize logging (e.g. 'log this', 'add this to lunch'). DO NOT log if they just ask 'is this healthy?' or 'how many calories?'.",
    parameters: {
      type: "OBJECT",
      properties: {
        mealName: {
          type: "STRING",
          description: "Name of the meal.",
        },
        category: {
          type: "STRING",
          description: "'Breakfast', 'Lunch', 'Snacks', 'Dinner'.",
        },
        calories: {
          type: "INTEGER",
          description: "Estimated calories.",
        },
        protein: {
          type: "NUMBER",
          description: "Estimated protein in grams.",
        },
        carbs: {
          type: "NUMBER",
          description: "Estimated carbs.",
        },
        fat: {
          type: "NUMBER",
          description: "Estimated fat.",
        },
        ingredients: {
          type: "ARRAY",
          description: "A breakdown of ingredients.",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              quantity: { type: "STRING" },
              calories: { type: "INTEGER" },
            },
            required: ["name", "calories"],
          },
        },
      },
      required: ["mealName", "calories", "protein", "carbs", "fat", "ingredients"],
    },
  },
  {
    name: "log_workout",
    description:
      "Log a workout, including strength training or cardio. ACTION GATE: Only call if user states they completed an exercise.",
    parameters: {
      type: "OBJECT",
      properties: {
        sessionType: {
          type: "STRING",
          description: "Must be 'Weightlifting', 'Cardio', 'Mixed', or 'Other'.",
        },
        durationMinutes: {
          type: "NUMBER",
        },
        caloriesBurned: {
          type: "NUMBER",
        },
        exercises: {
          type: "ARRAY",
          description: "List of exercises performed during the workout.",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              sets: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    reps: { type: "NUMBER" },
                    weight: { type: "NUMBER" },
                    rpe: { type: "NUMBER" },
                  },
                  required: ["reps"],
                },
              },
            },
            required: ["name", "sets"],
          },
        },
      },
      required: ["sessionType", "exercises"],
    },
  },
  {
    name: "save_ai_memory",
    description:
      "Save a permanent fact about the user for true long-term memory (e.g., fitness goals, diet, allergies, habits).",
    parameters: {
      type: "OBJECT",
      properties: {
        category: {
          type: "STRING",
          description: "Category of the memory.",
        },
        memory_text: {
          type: "STRING",
          description: "The specific fact to remember.",
        },
      },
      required: ["category", "memory_text"],
    },
  }
];
