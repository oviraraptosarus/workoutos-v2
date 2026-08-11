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
Your job: take their transcript and rewrite it as a rich, full personal journal entry.
Write it like a real diary entry — natural, flowing, first-person. Aim for 5 to 8 sentences.
Expand naturally on what they said. Add emotional texture and context where it fits — but never invent facts they didn't mention.
Do not use bullet points, headers, or markdown. Plain prose paragraphs only.
No hyphens, em-dashes, or corporate language. Write like a real human reflecting on their day.
Do not summarize — tell the story of the day in full.`;

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
