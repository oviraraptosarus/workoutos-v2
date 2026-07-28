import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { imageBase64, mimeType } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY environment variable is not set' }, { status: 500 });
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

        if (apiKey) {
            try {
                // Remove the data:image/jpeg;base64, prefix if present
                const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
                
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: systemInstruction }]
                        },
                        contents: [{
                            role: 'user',
                            parts: [
                                { text: 'Extract the nutritional info from this image.' },
                                {
                                    inline_data: {
                                        mime_type: mimeType || 'image/jpeg',
                                        data: base64Data
                                    }
                                }
                            ]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            response_mime_type: "application/json"
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    let text = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
                    
                    if (text) {
                        try {
                            const parsed = JSON.parse(text);
                            return NextResponse.json({ meal: parsed });
                        } catch (e) {
                            return NextResponse.json({ error: 'Failed to parse JSON from AI response' }, { status: 500 });
                        }
                    }
                } else {
                    const errorData = await response.text();
                    console.error('Gemini API Error:', errorData);
                    return NextResponse.json({ error: `Gemini API Error: ${errorData}` }, { status: response.status });
                }
            } catch (err) {
                console.error('Gemini API call failed:', err);
                return NextResponse.json({ error: 'Network error connecting to Gemini.' }, { status: 500 });
            }
        }

        // Fallback dummy data if no API key
        return NextResponse.json({
            meal: {
                category: "Snacks",
                name: "Scanned Food Item",
                portion: "1 serving",
                calories: 180,
                protein: 10,
                carbs: 20,
                fat: 5,
                sugar: 3,
                icon: "📸"
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
