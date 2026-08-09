import { orchestrator } from './src/lib/llm-orchestrator/Orchestrator.ts';
import 'dotenv/config';

async function test() {
    try {
        const response = await orchestrator.generateContent({
            requestId: 'test-123',
            systemInstruction: 'You are a helpful AI assistant.',
            prompt: 'log my workout',
            history: [],
            tools: [
                {
                    functionDeclarations: [
                        {
                            name: "log_workout",
                            description: "Log a workout or cardio activity.",
                            parameters: {
                                type: "OBJECT",
                                properties: {
                                    activityType: { type: "STRING" }
                                },
                                required: ["activityType"]
                            }
                        }
                    ]
                }
            ]
        });
        console.log("Success! Source Model:", response.sourceModel);
        console.log("Response:", response.text);
        if (response.functionCall) console.log("Function Call:", response.functionCall);
    } catch(e) {
        console.error("Orchestrator Failed:", e);
    }
}
test();
