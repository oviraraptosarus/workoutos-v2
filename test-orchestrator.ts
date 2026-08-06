import * as dotenv from 'dotenv';
dotenv.config();
import { orchestrator } from './src/lib/llm-orchestrator/Orchestrator';

(async () => {
    try {
        const response = await orchestrator.generateContent({
            prompt: 'remind me to wash my face in 5 minutes',
            tools: [
                {
                    functionDeclarations: [
                        {
                            name: "add_reminder",
                            description: "Create a generic reminder (e.g. 'Remind me to drink water', 'Remind me to stretch every day at 3pm').",
                            parameters: {
                                type: "OBJECT",
                                properties: {
                                    type: { type: "STRING" },
                                    title: { type: "STRING" },
                                    time: { type: "STRING" }
                                },
                                required: ["type", "title"]
                            }
                        }
                    ]
                }
            ],
            temperature: 0.7,
            maxOutputTokens: 800
        });
        console.log('RESPONSE:', response);
    } catch (e) {
        console.error('ERROR:', e);
    }
})();
