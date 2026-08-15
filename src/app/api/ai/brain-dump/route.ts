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
Your goal is to parse this chaos and extract:
1. "tasks": An array of distinct, actionable to-dos. If a task is extremely vague, clarify it slightly to make it actionable.
2. "summary": A single, cohesive string summarizing their brain dump. Write naturally as a single paragraph. Do NOT use markdown (no asterisks, hashes, etc.). Do not use section headers.

Output the result as a raw JSON object with two properties: "tasks" and "summary". Do not write a preamble, just return the JSON object.`;

        const response = await orchestrator.generateContent({
            systemInstruction,
            prompt: `Parse these thoughts into a JSON object containing "tasks" and "summary":\n\n"${rawTranscript}"`
        });

        let outputStr = response.text || "[]";
        
        // Clean up any markdown blocks if the LLM leaked them
        outputStr = outputStr.replace(/```json/g, '').replace(/```/g, '').trim();

        let tasks: string[] = [];
        let summary: string = "";
        try {
            const parsed = JSON.parse(outputStr);
            if (Array.isArray(parsed)) {
                tasks = parsed;
            } else {
                tasks = parsed.tasks || [];
                summary = parsed.summary || "";
            }
        } catch (e) {
            console.error("Failed to parse JSON object from AI:", outputStr);
            // Fallback
            tasks = outputStr.split('\n').map(s => s.replace(/^- /, '').trim()).filter(Boolean);
        }

        return NextResponse.json({ tasks, summary });
    } catch (err: any) {
        console.error('Brain dump error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
