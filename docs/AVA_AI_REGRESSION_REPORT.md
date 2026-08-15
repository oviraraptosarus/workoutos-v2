# AVA AI REGRESSION REPORT

*This document will be updated as we refactor the intelligence layer.*

## Identified Regressions in Monolithic Architecture
1. **[CRITICAL] Image to False Logging**: User uploads image and asks "is this harmful?". AI incorrectly identifies this as a trigger to log the meal, acting without authorization.
   - **Root Cause**: Missing Explicit Action Gate. Single-pass LLM prompt conflates visual analysis with mutation intent.
   - **Resolution Status**: Pending Pipeline Refactor.

2. **[HIGH] Over-Fetching Context**: `GlobalAICopilot.tsx` fetches the entire database (tasks, budget, meals, workouts) on every client request regardless of the user's prompt.
   - **Root Cause**: Lack of dynamic Context Pipeline.
   - **Resolution Status**: Pending Context Map Implementation.

3. **[MEDIUM] Fake Success on Tool Calls**: The orchestrator triggers tools but doesn't wait for DB confirmation before returning "Done" to the user.
   - **Root Cause**: Fire-and-forget tool handlers in `GlobalAICopilot.tsx`.
   - **Resolution Status**: Pending Backend Tool Verification Implementation.
