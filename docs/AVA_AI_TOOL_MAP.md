# AVA AI TOOL MAP

## Universal Tool Schema
All tools MUST have:
- `name`: Tool identifier.
- `description`: Purpose and exact conditions for when the tool SHOULD and SHOULD NOT be called.
- `parameters`: Input schema for the tool arguments.

## Tool Result Verification
A tool call is only successful if the backend confirms the mutation.

### `add_task`
- **Validation**: Verify `title` is not empty. If `dueDate` is provided, ensure it's valid.
- **Verification**: Query `tasks` table for the newly generated task ID.
- **Action Gate**: Only call if user explicitly asks to "add", "remind", "create task", "schedule".

### `log_nutrition`
- **Validation**: Verify macros are numbers.
- **Verification**: Query `meal_entries` for the new entry.
- **Action Gate**: Only call if user says "log this", "ate this", "add to lunch". DO NOT call for "is this healthy?" or "how many calories?".

### `log_workout`
- **Validation**: Verify `sessionType` and `exercises` array structure.
- **Verification**: Query `workout_logs` for new entry.
- **Action Gate**: Only call if user states they *completed* a workout.

### `log_water`
- **Validation**: Verify `amount` is a number > 0.
- **Verification**: Query `daily_logs` to ensure `water_ml_total` increased.
- **Action Gate**: Call immediately if user explicitly mentions drinking water.

### `save_ai_memory`
- **Validation**: Verify `category` is valid.
- **Verification**: Query `ai_memories` table.
- **Action Gate**: Call when user reveals a persistent preference, constraint, or behavioral pattern.
