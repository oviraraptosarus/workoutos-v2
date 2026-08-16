/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseProvider } from './BaseProvider';
import { CompletionRequest, CompletionResponse } from '../types';

export class OpenAIProvider extends BaseProvider {
    async generateContent(model: string, request: CompletionRequest, signal?: AbortSignal): Promise<CompletionResponse> {
        const baseURL = this.modelConfig.baseURL || 'https://api.openai.com/v1';
        const url = `${baseURL}/chat/completions`;
        
        const messages: any[] = [];
        
        if (request.systemInstruction) {
            messages.push({ role: 'system', content: request.systemInstruction });
        }

        if (request.history && request.history.length > 0) {
            request.history.forEach(msg => {
                const role = msg.role === 'model' ? 'assistant' : 'user';
                // Simplified string mapping, images for OpenAI require URL format
                messages.push({ role, content: msg.text || '' });
            });
        }

        const currentParts: any[] = [];
        if (request.prompt) {
            currentParts.push({ type: 'text', text: request.prompt });
        }
        if (request.image) {
            currentParts.push({
                type: 'image_url',
                image_url: { url: request.image }
            });
        }

        if (currentParts.length > 0) {
            messages.push({ role: 'user', content: currentParts });
        } else if (messages.length === 0 || messages[messages.length-1].role !== 'user') {
             messages.push({ role: 'user', content: 'Hello' });
        }

        // Map Gemini tools to OpenAI tools
        let tools: any = undefined;
        if (request.tools && request.tools.length > 0) {
            const geminiTools = request.tools[0]?.functionDeclarations;
            if (geminiTools && Array.isArray(geminiTools)) {
                const mapTypeToLowercase = (obj: any): any => {
                    if (!obj || typeof obj !== 'object') return obj;
                    if (Array.isArray(obj)) return obj.map(mapTypeToLowercase);
                    const newObj: any = {};
                    for (const [key, value] of Object.entries(obj)) {
                        if (key === 'type' && typeof value === 'string') {
                            newObj[key] = value.toLowerCase();
                        } else {
                            newObj[key] = mapTypeToLowercase(value);
                        }
                    }
                    return newObj;
                };

                tools = geminiTools.map((t: any) => ({
                    type: 'function',
                    function: {
                        name: t.name,
                        description: t.description,
                        parameters: mapTypeToLowercase(t.parameters)
                    }
                }));
            }
        }

        const body: any = {
            model: model,
            messages: messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxOutputTokens ?? 8192,
            tools: tools
        };

        if (request.responseFormat === 'json') {
            body.response_format = { type: "json_object" };
        }

        const startTime = Date.now();
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(body),
            signal
        });

        if (!response.ok) {
            this.handleResponseError(response.status, response.statusText, await response.text());
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message;
        
        let functionCall = undefined;
        if (message?.tool_calls && message.tool_calls.length > 0) {
            const call = message.tool_calls[0].function;
            functionCall = {
                name: call.name,
                args: JSON.parse(call.arguments || '{}')
            };
        }

        return {
            text: message?.content || '',
            functionCall,
            sourceModel: this.id,
            latencyMs: Date.now() - startTime,
            retries: 0
        };
    }
}
