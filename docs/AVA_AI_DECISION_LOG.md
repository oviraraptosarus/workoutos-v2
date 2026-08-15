# AVA AI DECISION LOG

## Architecture Redesign Decisions

### Decision 1: Single-Pass Strict Schema vs Two-Pass Hard Gate
**Problem**: We need to prevent the AI from executing tools when the user just asks for analysis.
**Options**:
1. Two-pass: LLM 1 outputs Intent. If intent != mutation, filter out tools from LLM 2. (High latency).
2. Single-pass: Force LLM to output a JSON object containing `{ intent, reasoning, action_authorized, tool_calls }`.
**Decision**: Single-pass strict schema.
**Rationale**: Lower latency, cheaper. Modern models (Gemini 1.5 Pro, Llama 3 70B) are capable of sequential reasoning in structured output before emitting tool calls.

### Decision 2: Backend vs Frontend Context Fetching
**Problem**: The frontend currently fetches all DB data to send to the AI as context.
**Decision**: Move Context Retrieval to the backend (`route.ts`).
**Rationale**: The client should not fetch the entire database on every request. The backend router will parse the intent and dynamically fetch only the relevant `appState` slices directly via Supabase admin/server client.

### Decision 3: Preserving Existing Tools
**Problem**: How to handle existing tool implementations?
**Decision**: Retain all existing tool functions but wrap them in the new Verification Contract (they must return success/failure boolean based on DB writes).
