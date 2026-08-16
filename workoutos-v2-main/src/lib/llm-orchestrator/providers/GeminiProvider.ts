import { BaseProvider } from './BaseProvider';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CompletionRequest, CompletionResponse, ProviderInterface } from '../types';

export class GeminiProvider extends BaseProvider {
    async generateContent(model: string, request: CompletionRequest, signal?: AbortSignal): Promise<CompletionResponse> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        
        const contents: any[] = [];
        
        // Map history
        if (request.history && request.history.length > 0) {
            request.history.forEach((msg) => {
                const parts: any[] = [];
                if (msg.imageUrl && msg.imageUrl.startsWith('data:image')) {
                    const matches = msg.imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
                    }
                }
                if (msg.text) parts.push({ text: msg.text });
                if (parts.length > 0) contents.push({ role: msg.role, parts });
            });
        }

        // Current Prompt
        const currentParts: any[] = [];
        if (request.image && request.image.startsWith('data:image')) {
            const matches = request.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                currentParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
            }
        }
        if (request.prompt) currentParts.push({ text: request.prompt });
        
        if (currentParts.length > 0) {
            // Prevent duplicate prompts if frontend already appended it to history
            const lastContent = contents[contents.length - 1];
            const isDuplicate = lastContent && lastContent.role === 'user' && 
                lastContent.parts.some((p: any) => p.text === request.prompt);
            
            if (!isDuplicate) {
                contents.push({ role: 'user', parts: currentParts });
            }
        }

        if (contents.length === 0) {
            contents.push({ role: 'user', parts: [{ text: request.prompt || 'Hello' }] });
        }

        const generationConfig: any = {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxOutputTokens ?? 800
        };

        if (request.responseFormat === 'json') {
            generationConfig.response_mime_type = 'application/json';
        }

        const body = {
            systemInstruction: request.systemInstruction ? { parts: [{ text: request.systemInstruction }] } : undefined,
            contents,
            tools: request.tools,
            generationConfig
        };

        const startTime = Date.now();
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal
        });

        if (!response.ok) {
            this.handleResponseError(response.status, response.statusText, await response.text());
        }

        const data = await response.json();
        
        // Also map rate limits sent inside successful 200 responses if necessary (some APIs do this)
        if (data.error) {
            this.handleResponseError(data.error.code || 500, data.error.status || 'ERROR', data.error.message || 'Unknown error');
        }

        const functionCall = data.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
        const text = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;

        return {
            text: text || '',
            functionCall,
            sourceModel: this.id,
            latencyMs: Date.now() - startTime,
            retries: 0
        };
    }
}
