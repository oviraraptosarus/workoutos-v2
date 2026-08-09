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
- barcode_number: The digits of the barcode if clearly visible (ignore spaces), otherwise null.
- category: A best guess between "Breakfast", "Lunch", "Dinner", or "Snacks". Default to "Snacks".
- name: The name of the food item or product.
- portion: The serving size (e.g. "1 bar", "100g", "1 bottle").
- calories: Total calories (kcal).
- protein: Total protein in grams.
- carbs: Total carbohydrates in grams.
- fat: Total fat in grams.
- sugar: Total sugar in grams.
- icon: A single relevant emoji (e.g. 🍎, 🥤, 🥩).

IMPORTANT: If the image is a barcode and you cannot see the nutrition label, use any visible brand/product text to guess the product and estimate its macros. Do not just return 0 for everything unless you are absolutely sure it has 0 calories.

Return a valid JSON object ONLY. Do not include markdown code blocks, do not include any other text.
Example response:
{
  "barcode_number": "123456789012",
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
                prompt: 'Extract the nutritional info from this image. If it is a barcode, extract the barcode number.',
                image: universalImage,
                responseFormat: 'json',
                temperature: 0.1
            });

            if (response.text) {
                try {
                    // Try to parse the LLM text.
                    let cleanText = response.text;
                    if (cleanText.startsWith('```json')) {
                        cleanText = cleanText.replace(/```json\n?/, '').replace(/```$/, '');
                    }
                    const parsed = JSON.parse(cleanText);

                    // Try OpenFoodFacts if a barcode was found
                    if (parsed.barcode_number) {
                        try {
                            const digits = String(parsed.barcode_number).replace(/\D/g, '');
                            if (digits.length >= 8) {
                                const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${digits}.json`);
                                if (offRes.ok) {
                                    const offData = await offRes.json();
                                    if (offData.status === 1 && offData.product) {
                                        const p = offData.product;
                                        parsed.name = p.product_name || parsed.name || 'Unknown Product';
                                        if (p.nutriments) {
                                            const n = p.nutriments;
                                            parsed.calories = Math.round(n['energy-kcal_100g'] || n['energy-kcal_serving'] || parsed.calories || 0);
                                            parsed.protein = Math.round(n['proteins_100g'] || n['proteins_serving'] || parsed.protein || 0);
                                            parsed.carbs = Math.round(n['carbohydrates_100g'] || n['carbohydrates_serving'] || parsed.carbs || 0);
                                            parsed.fat = Math.round(n['fat_100g'] || n['fat_serving'] || parsed.fat || 0);
                                            parsed.sugar = Math.round(n['sugars_100g'] || n['sugars_serving'] || parsed.sugar || 0);
                                            parsed.portion = p.serving_size || '100g';
                                        }
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('OpenFoodFacts fetch failed:', err);
                        }
                    }

                    // Remove barcode_number before returning to frontend just in case
                    delete parsed.barcode_number;

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
    } catch (error: any) {
        const errorId = `ORCH-${Math.floor(1000 + Math.random() * 9000)}`;
        console.error(`[${errorId}] Fatal Request Error in Vision API:`, error.stack || error);
        return NextResponse.json({ error: `Request failed. Error ID: ${errorId}` }, { status: 500 });
    }
}
