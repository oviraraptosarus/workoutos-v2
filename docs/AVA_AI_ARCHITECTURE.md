# AVA AI Architecture

## 1. Core Philosophy
AVA is not a generic chatbot. It is a **context-aware operating intelligence** sitting above the user's data.
The framework itself is the product. The AI models (Gemini, OpenRouter) are merely interchangeable reasoning engines.

## 2. Mandatory Pre-Action Pipeline
Every user request MUST flow through this exact pipeline. No direct "Input -> Tool" execution is permitted.

1. **INPUT**: Receive user message/image.
2. **INTENT CLASSIFICATION**: Identify if the user wants information, analysis, or a mutation (action).
3. **CONTEXT RETRIEVAL**: Fetch relevant data domains based on the intent (e.g. fetch sleep data for recovery questions).
4. **FACT CHECK / DATA VALIDATION**: Verify against the Live App State.
5. **REASONING**: Compare options, determine highest-value response.
6. **ACTION GATE (AUTHORIZATION)**: Explicitly confirm the user asked for a mutation before calling any tool.
7. **TOOL EXECUTION**: Call the appropriate tool.
8. **RESULT VERIFICATION**: Verify the database write actually succeeded.
9. **RESPONSE**: Output the final result.

## 3. Multi-Model Routing
AVA abstracts provider logic. 
- Vision requests route to models with strong multimodal capabilities.
- Complex reasoning routes to the strongest configured model (e.g., Llama 70B, GPT-4o).
- Simple task extraction routes to faster/cheaper models.

## 4. Source Hierarchy
When resolving conflicts, the reasoning engine must prioritize sources in this order:
1. Explicit current user statement
2. Current persisted application data
3. Verified historical application data
4. Explicit user memory/preferences
5. Derived analytics
6. Model inference
7. General knowledge
