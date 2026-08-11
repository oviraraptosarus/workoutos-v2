import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/llm-orchestrator/Orchestrator';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { rawTranscript, userName, defaultPriority = 'medium' } = body;

        if (!rawTranscript?.trim()) {
            return NextResponse.json({ tasks: [] });
        }

        const systemInstruction = `You are Ava, the smart AI assistant for "Workout OS".
The user is doing a "Brain Dump" - pouring out their unstructured thoughts, ideas, and chaotic to-dos.
Your exact goal is to parse this chaos and extract ONLY the distinct, actionable tasks.
Output the tasks as a raw JSON array of strings. Do not use markdown, do not write a preamble, just return the JSON array.
If a task is extremely vague, clarify it slightly to make it actionable. Keep them concise.`;

        const response = await orchestrator.generateContent({
            systemInstruction,
            prompt: `Parse these thoughts into a JSON array of task strings:\n\n"${rawTranscript}"`
        });

        let outputStr = response.text || "[]";
        
        // Clean up any markdown blocks if the LLM leaked them
        outputStr = outputStr.replace(/```json/g, '').replace(/```/g, '').trim();

        let tasks: string[] = [];
        try {
            tasks = JSON.parse(outputStr);
            if (!Array.isArray(tasks)) {
                tasks = [outputStr];
            }
        } catch (e) {
            console.error("Failed to parse JSON array from AI:", outputStr);
            // Fallback, split by newlines if it returned a list
            tasks = outputStr.split('\n').map(s => s.replace(/^- /, '').trim()).filter(Boolean);
        }

        return NextResponse.json({ tasks });
    } catch (err: any) {
        console.error('Brain dump error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
