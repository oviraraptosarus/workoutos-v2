# AVA AI TRUTH MATRIX

## Current AI Feature Regression Status

| Capability | Existing Implementation | Provider | Context Required | Tool Required | Database Dependency | Expected Behavior | Tested? | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Image to Task** | `route.ts` | Gemini/OpenRouter | Planner | `add_task` | `tasks` | Parse text from image to create task | No | Needs Verification |
| **Log Water** | `route.ts` | Any | Dashboard | `log_water` | `daily_logs` | Log water ml | No | Needs Verification |
| **Log Meal** | `route.ts` | Vision | Nutrition | `log_nutrition`| `meal_entries` | Parse macros from food image & log | No | Action Gate Bug |
| **Log Workout** | `route.ts` | Any | Workout | `log_workout` | `workout_logs` | Log cardio and strength sessions | No | Just Updated |
| **Food Analysis** | `route.ts` | Vision | Nutrition | None | None | Analyze food image for harm/macros | No | Failed (Triggered Tool) |
| **Brain Dump** | `/api/ai/brain-dump` | Any | None | `add_multiple_tasks` | `tasks` | Parse unstructured list into tasks | No | Needs Verification |
| **AI Memory** | `route.ts` | Any | All | `save_ai_memory` | `ai_memories` | Save preference/pattern to memory | No | Needs Verification |

*Note: All current features must be tested against the New Action Gate to ensure no false positives trigger database writes.*
