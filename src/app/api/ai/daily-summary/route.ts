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
Your job: take their transcript and extract the essence into a highly clear, concise, and beautifully structured summary, similar to professional podcast show notes.

Follow these strict framework guidelines:
1. Core Narrative: Start with a brief overview capturing the main theme and mood of the day.
2. Key Insights: Distill all important events, ideas, and accomplishments into punchy, easy-to-read insights.
3. Clarity & Conciseness: Remove all fluff and spoken filler. Get straight to the point.
4. Completeness: CRITICAL — You MUST pick up and include ALL important points, facts, and events mentioned. Do NOT omit any details.
5. Tone: Keep it warm, personal, and written in the first person (e.g., "I focused on...", "My main takeaway was...").

Use clean, spaced-out formatting to make it scannable, extremely clear, and impactful.`;

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
