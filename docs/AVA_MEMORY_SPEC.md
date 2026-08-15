# AVA MEMORY SPECIFICATION

## Philosophy
Do not create another memory system. Keep the existing persistent memory architecture (`ai_memories` table).
AVA should remember stable facts, not every conversational sentence.

## Memory Categories
- **PREFERENCE**: "I prefer to work out in the mornings."
- **GOAL**: "I want to run a 5k by December."
- **CONSTRAINT**: "I have bad knees, no heavy squats."
- **ROUTINE**: "I always drink a protein shake at 4 PM."
- **FACT**: "I am allergic to peanuts."
- **BEHAVIOR_PATTERN**: "User consistently misses macros on weekends." (Inferred)

## Memory Confidence
The AI must distinguish explicitly stated facts from inferred patterns.
- **Observed**: "User explicitly told me they hate breakfast."
- **Inferred**: "User skipped breakfast 4 times this week." 
*Do NOT store uncertain inferences as hard facts.*

## Memory Lifecycle
- **Save**: Call `save_ai_memory` when a new valid category emerges.
- **Retrieve**: Fetch relevant memories in the Context Pipeline.
- **Update/Delete**: If a user states a new preference that contradicts an old one, update or delete the stale memory. No stale memory should override current explicit preferences.
