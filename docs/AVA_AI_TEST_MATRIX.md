# AVA AI TEST MATRIX

## Core Functional Tests

| Scenario | Input | Expected Intent | Expected Context | Expected Action | Expected Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Image Analysis Gate** | "Is this harmful?" + Image | `ANALYSIS` | `Nutrition` | None. Do NOT call `log_nutrition`. | Output only text review. |
| **Direct Logging** | "Log this for lunch." + Image | `LOGGING` | `Nutrition`, `Today` | Call `log_nutrition`. | Verify DB write, output confirmation. |
| **Memory Extraction** | "I'm allergic to dairy." | `LOGGING` (Memory) | None | Call `save_ai_memory`. | Verify `ai_memories` write. |
| **Planner Brain Dump** | "I need to study math tomorrow and run a 5k." | `CREATION` | `Tasks`, `Workout` | Call `add_multiple_tasks`. | Verify task creation. |
| **Historical Query** | "Did I sleep well this week?" | `RETRIEVAL` | `Sleep`, `Recovery` | None. | Output summarized analysis. |
| **Water Logging** | "Drank 2 glasses of water." | `LOGGING` | `Dashboard` | Call `log_water`. | Verify DB write. |
| **Fake Success Prevent**| "Log this meal." (DB mocked to fail) | `LOGGING` | `Nutrition` | Call `log_nutrition`. | Return failure message to user. |
