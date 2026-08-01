import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/llm-orchestrator/Orchestrator';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { imageBase64, mimeType } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const systemInstruction = `You are a strict JSON-only API that extracts nutritional information from food labels and barcodes.
Given an image of a food item, nutrition label, or barcode, extract the following:
- category: A best guess between "Breakfast", "Lunch", "Dinner", or "Snacks". Default to "Snacks".
- name: The name of the food item or product.
- portion: The serving size (e.g. "1 bar", "100g", "1 bottle").
- calories: Total calories (kcal).
- protein: Total protein in grams.
- carbs: Total carbohydrates in grams.
- fat: Total fat in grams.
- sugar: Total sugar in grams.
- icon: A single relevant emoji (e.g. 🍎, 🥤, 🥩).

Return a valid JSON object ONLY. Do not include markdown code blocks, do not include any other text.
Example response:
{
  "category": "Snacks",
  "name": "Protein Bar",
  "portion": "1 bar",
  "calories": 200,
  "protein": 20,
  "carbs": 22,
  "fat": 6,
  "sugar": 2,
  "icon": "🍫"
}`;

        try {
            // Remove the data:image/jpeg;base64, prefix if present, then rebuild it as the Orchestrator expects a full URI
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const universalImage = `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;

            const response = await orchestrator.generateContent({
                systemInstruction: systemInstruction,
                prompt: 'Extract the nutritional info from this image.',
                image: universalImage,
                responseFormat: 'json',
                temperature: 0.1
            });

            if (response.text) {
                try {
                    // Try to parse the LLM text. (Some models might wrap in ```json, so we could strip it if needed, but responseFormat should handle it)
                    let cleanText = response.text;
                    if (cleanText.startsWith('```json')) {
                        cleanText = cleanText.replace(/```json\n?/, '').replace(/```$/, '');
                    }
                    const parsed = JSON.parse(cleanText);
                    return NextResponse.json({ meal: parsed });
                } catch {
                    return NextResponse.json({ error: 'Failed to parse JSON from AI response' }, { status: 500 });
                }
            } else {
                return NextResponse.json({ error: `LLM Returned Empty Content` }, { status: 500 });
            }
        } catch (err: any) {
            console.error('Vision API call failed:', err);
            return NextResponse.json({ error: `Orchestrator error: ${err.message}` }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
