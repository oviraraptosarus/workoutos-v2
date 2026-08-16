# Global AI Orchestrator Blueprint

## 1. The Core Philosophy
The AI in this architecture is not a chatbot. It is a **Global AI Copilot** (Orchestrator). It acts as an execution engine that reads the user's state, reasons over it, and directly mutates the database on their behalf. Friction must be absolutely zero. 

## 2. The Orchestration Loop
All AI requests follow this strict server-side pipeline (`/api/ai/chat`):

1. **Context Gathering (`Promise.all`)**:
   Before the AI even sees the prompt, the server fetches the user's entire relevant database state (e.g., Profile, Tasks, Reminders, Goals, Logs).
   - *Rule*: Wrap every fetch in a `.catch()` so one failing module doesn't kill the entire context object.
   - *Result*: The AI receives a massive JSON object representing the user's "Now".

2. **The System Prompt (The Persona)**:
   The AI must be given a strict, aggressive, and highly functional persona.
   - *Rule*: Instruct the AI to NEVER hallucinate API calls.
   - *Rule*: Instruct the AI to respond primarily with structured JSON commands (e.g., `create_task`, `log_metric`) alongside a brief conversational reply.

3. **Provider Failover (Resilience)**:
   Never rely on a single LLM provider. The Orchestrator must use a `while` loop that attempts the primary provider (e.g., Google GenAI), and if it hits a 500, 429, or Timeout, instantly falls back to a secondary provider (e.g., OpenRouter / Claude).
   - *Rule*: Do not throw fatal errors up to the UI unless all fallback models are exhausted.

4. **Action Execution**:
   Once the LLM returns its JSON payload, the Server parses the commands and executes the Supabase mutations *before* returning the final response to the client.

## 3. Tool Usage (Function Calling)
Do not rely on the client to parse tools. The Orchestrator should demand a specific JSON output format in the system prompt.
Example Schema:
```json
{
  "reply": "I've added the report to your pipeline.",
  "actions": [
    { "type": "CREATE_TASK", "payload": { "title": "Finish TPS Report", "priority": "high" } }
  ]
}
```

## 4. UI Integration
- The AI Copilot should be globally accessible (e.g., from the Top Navigation Bar).
- Use `useEffect` event listeners (`window.dispatchEvent`) so any component in the app can trigger the Copilot without prop drilling.
- The UI must actively listen for successful AI actions and dispatch events to refresh local component states (e.g., `window.dispatchEvent(new Event('refresh_tasks'))`).
