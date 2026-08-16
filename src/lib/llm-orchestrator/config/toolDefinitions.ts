export const AVA_TOOLS = [
  {
    name: "add_task",
    description:
      "Add a new task to the user's planner. STRICT USAGE: ONLY call this when the user explicitly says 'add task', 'remind me', 'create a task', 'create a reminder', 'schedule', 'to-do', or 'put on my list'. NEVER use this for workout plans, meal plans, training programs, diet plans, exercise routines, or any coaching/fitness generation request. If the user says 'make me a plan' or 'design a workout', use save_workout_template instead. If they say 'give me a diet', use generate_meal_plan instead.",
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
      "Add multiple new tasks to the user's planner at once. Use specifically when parsing a Brain Dump or explicit multi-task request. Same strict rules as add_task: ONLY for explicit task/reminder/to-do creation, NEVER for workout or diet plan generation.",
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
      "Log a workout, including strength training or cardio. ACTION GATE: Only call if user states they completed an exercise. Do NOT use this when the user asks to CREATE or DESIGN a workout plan (use save_workout_template for that).",
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
  },
  {
    name: "save_workout_template",
    description:
      "Generate and save a complete, structured workout plan as a reusable template in the user's workout library. ALWAYS use this when the user asks you to create, generate, design, build, or make any workout plan, training plan, training program, exercise routine, or fitness program. This includes requests like 'make me a HIIT plan', 'design a push day', 'give me a dumbbell workout', 'training plan for fat loss', 'create a 4 day split'. Do NOT just describe the workout in text. ALWAYS use this tool to structure the output. Ask for: target muscle groups, duration, equipment, experience level, and training goal if not already in the user profile.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: {
          type: "STRING",
          description:
            "The workout template name (e.g. 'Push Hypertrophy A', 'Full Body Beginner', '30-min Dumbbell HIIT Circuit').",
        },
        description: {
          type: "STRING",
          description:
            "A brief description of the workout including target muscles, training style, and goal (e.g. 'Chest, shoulders, triceps focused on volume hypertrophy with dumbbell-only exercises').",
        },
        exercises: {
          type: "ARRAY",
          description:
            "The ordered list of exercises in this workout. Must include real, specific exercise names.",
          items: {
            type: "OBJECT",
            properties: {
              name: {
                type: "STRING",
                description:
                  "Specific exercise name (e.g. 'Dumbbell Goblet Squat', 'Incline Dumbbell Press', 'Burpees'). Use precise, real exercise names.",
              },
              sets: {
                type: "STRING",
                description:
                  "Sets and reps/duration string (e.g. '3 sets x 10 reps', '4 sets x 8-10 reps', '3 sets x 45s work / 15s rest').",
              },
              notes: {
                type: "STRING",
                description:
                  "Coaching notes for this exercise (e.g. 'Slow eccentric, 2 sec down', 'Rest 90s between sets', 'Superset with next exercise').",
              },
              order: {
                type: "NUMBER",
                description: "Exercise order starting from 0.",
              },
            },
            required: ["name", "sets", "order"],
          },
        },
      },
      required: ["name", "exercises"],
    },
  },
  {
    name: "generate_meal_plan",
    description:
      "Generate a structured meal plan or diet plan for the user. ALWAYS use this when the user asks for a diet plan, meal plan, nutrition plan, cutting diet, bulking diet, or asks 'what should I eat'. This includes requests like 'give me a 2000 calorie cutting diet', 'meal plan for fat loss', 'what should I eat today', 'create a diet for muscle gain', 'plan my meals'. Do NOT use add_task for these requests.",
    parameters: {
      type: "OBJECT",
      properties: {
        planName: {
          type: "STRING",
          description:
            "Name of the meal plan (e.g. '2000 kcal Cutting Plan', 'Lean Bulk Meal Plan', 'High Protein Indian Diet').",
        },
        goal: {
          type: "STRING",
          description: "'cutting', 'bulking', 'maintenance', or 'recomposition'.",
        },
        dailyCalories: {
          type: "INTEGER",
          description: "Target daily calories for this plan.",
        },
        dailyProtein: {
          type: "NUMBER",
          description: "Target daily protein in grams.",
        },
        dailyCarbs: {
          type: "NUMBER",
          description: "Target daily carbs in grams.",
        },
        dailyFat: {
          type: "NUMBER",
          description: "Target daily fat in grams.",
        },
        meals: {
          type: "ARRAY",
          description: "The structured meals for the day.",
          items: {
            type: "OBJECT",
            properties: {
              name: {
                type: "STRING",
                description: "Meal name (e.g. 'Breakfast', 'Pre-Workout Snack', 'Lunch', 'Dinner').",
              },
              time: {
                type: "STRING",
                description: "Suggested time (e.g. '7:00 AM', '12:30 PM').",
              },
              foods: {
                type: "STRING",
                description:
                  "Detailed food items with portions (e.g. '4 egg whites + 1 whole egg scrambled, 2 slices whole wheat toast, 1 medium banana').",
              },
              calories: {
                type: "INTEGER",
                description: "Calories for this meal.",
              },
              protein: {
                type: "NUMBER",
                description: "Protein for this meal in grams.",
              },
              carbs: {
                type: "NUMBER",
                description: "Carbs for this meal in grams.",
              },
              fat: {
                type: "NUMBER",
                description: "Fat for this meal in grams.",
              },
            },
            required: ["name", "foods", "calories", "protein"],
          },
        },
        coachingNotes: {
          type: "STRING",
          description:
            "Coaching notes explaining why this plan works for the user's goal, timing tips, hydration targets, and practical alternatives.",
        },
      },
      required: ["planName", "goal", "dailyCalories", "dailyProtein", "meals"],
    },
  },
];



