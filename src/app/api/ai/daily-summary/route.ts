import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/llm-orchestrator/Orchestrator';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { rawTranscript, userName } = body;

        if (!rawTranscript?.trim()) {
            return NextResponse.json({ summary: '' });
        }

        const systemInstruction = `You are Ava, a warm personal AI writer for "Workout OS".
The user just did a voice journal entry — raw, unedited speech about their day.
Your job: take their transcript and extract the essence into a highly clear, concise, and beautifully written summary.

Follow these strict framework guidelines:
1. Natural Flow: Write a single, cohesive, conversational paragraph (or two).
2. NO AI TRACES: NEVER use markdown (no asterisks, no bolding, no hashtags, no hyphens, no bullet points). NEVER use section headers like "Core Narrative" or "Key Insights". Do not include placeholders like "[Insert Date]".
3. Clarity & Conciseness: Remove all fluff and spoken filler. Get straight to the point.
4. Completeness: You MUST pick up and include ALL important points, facts, and events mentioned.
5. Tone: Keep it warm, personal, and written in the first person (e.g., "I focused on...", "My main takeaway was...").`;

        const response = await orchestrator.generateContent({
            systemInstruction,
            prompt: `Write a full journal entry for ${userName || 'the user'} based on what they said:\n\n"${rawTranscript}"`
        });

        return NextResponse.json({ summary: response.text });
    } catch (err: any) {
        console.error('Daily summary error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
