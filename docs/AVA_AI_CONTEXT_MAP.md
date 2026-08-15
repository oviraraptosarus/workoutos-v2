# AVA AI CONTEXT MAP

AVA must retrieve ONLY relevant context before reasoning. Injecting the entire database is forbidden.

## Context Domains & Triggers

### 1. NUTRITION
- **Triggers**: "Log this meal", "Review my dinner", "How many calories?", "Is this harmful?"
- **Retrieved Data**: Today's nutrition, calorie target, macro targets, known allergies, meal context, recent nutrition pattern.

### 2. WORKOUT / RECOVERY
- **Triggers**: "Log my chest day", "What should I lift?", "Why am I tired?"
- **Retrieved Data**: Workout history (last 30 days), sleep logs, energy ratings, current training split.

### 3. PLANNER / EXECUTION
- **Triggers**: "What should I do next?", "Add task", "I have 30 minutes"
- **Retrieved Data**: Today's tasks, macro goals, task execution scores, behavior patterns (procrastination).

### 4. BUDGET
- **Triggers**: "Log expense", "Can I afford this?"
- **Retrieved Data**: Income, expenses, monthly budget target.

## Dynamic Retrieval Pipeline (Backend)
1. User provides input.
2. AI Router classifies intent/domain.
3. Node.js backend selectively fetches the required domain records from Supabase.
4. AI Orchestrator executes prompt using ONLY the fetched domain context.
