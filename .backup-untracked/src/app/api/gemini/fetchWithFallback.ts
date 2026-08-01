export async function fetchWithFallback(urlTemplate: (model: string) => string, options: RequestInit, initialModel: string) {
    // Array of free tier models to fallback to in order
    const fallbackModels = [
        initialModel,
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro'
    ];

    let lastResponse = null;

    // Deduplicate the array just in case initialModel is already in the list
    const uniqueModels = Array.from(new Set(fallbackModels));

    for (const model of uniqueModels) {
        const url = urlTemplate(model);
        
        try {
            const response = await fetch(url, options);
            
            // If the response is successful (2xx), return it immediately.
            if (response.ok) {
                return response;
            }
            
            // If it's an error (429, 500, 404, etc.), save it and try the next model.
            lastResponse = response;
            console.warn(`[Gemini API] Error (${response.status}) hit for model ${model}. Falling back to next model...`);
        } catch (error) {
            console.error(`[Gemini API] Network error for model ${model}:`, error);
            // On network error, we can try the next one too, just in case.
        }
    }

    // If all models hit 429 or failed, return the last response or throw
    if (lastResponse) {
        return lastResponse;
    }
    
    throw new Error('All fallback models failed due to network errors.');
}
