import { BaseProvider } from './BaseProvider';
import { CompletionRequest, CompletionResponse } from '../types';

export class AnthropicProvider extends BaseProvider {
    async generateContent(model: string, request: CompletionRequest, signal?: AbortSignal): Promise<CompletionResponse> {
        const url = 'https://api.anthropic.com/v1/messages';
        
        const messages: any[] = [];
        
        // Anthropic system instruction is passed at the top level, not in messages
        let system = request.systemInstruction || '';
        
        if (request.responseFormat === 'json') {
            system += '\n\nYou MUST return a valid JSON object only. Do not include any other text, markdown blocks, or explanations.';
        }

        if (request.history && request.history.length > 0) {
            request.history.forEach(msg => {
                const role = msg.role === 'model' ? 'assistant' : 'user';
                messages.push({ role, content: msg.text || '' });
            });
        }

        const currentParts: any[] = [];
        if (request.image) {
            // Claude requires base64 images in a specific format
            const matches = request.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                currentParts.push({
                    type: "image",
                    source: {
                        type: "base64",
                        media_type: matches[1],
                        data: matches[2]
                    }
                });
            }
        }
        if (request.prompt) {
            currentParts.push({ type: 'text', text: request.prompt });
        }

        if (currentParts.length > 0) {
            messages.push({ role: 'user', content: currentParts });
        } else if (messages.length === 0 || messages[messages.length-1].role !== 'user') {
            messages.push({ role: 'user', content: 'Hello' });
        }

        // Map Gemini tools to Anthropic format
        let tools: any = undefined;
        if (request.tools && request.tools.length > 0) {
            const geminiTools = request.tools[0]?.functionDeclarations;
            if (geminiTools && Array.isArray(geminiTools)) {
                tools = geminiTools.map((t: any) => ({
                    name: t.name,
                    description: t.description,
                    input_schema: t.parameters
                }));
            }
        }

        const body: any = {
            model: model,
            system: system,
            messages: messages,
            max_tokens: request.maxOutputTokens ?? 1024,
            temperature: request.temperature ?? 0.7,
        };

        if (tools) {
            body.tools = tools;
        }

        const startTime = Date.now();
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body),
            signal
        });

        if (!response.ok) {
            this.handleResponseError(response.status, response.statusText, await response.text());
        }

        const data = await response.json();
        
        let text = '';
        let functionCall = undefined;
        
        if (data.content && Array.isArray(data.content)) {
            const textBlock = data.content.find((c: any) => c.type === 'text');
            if (textBlock) text = textBlock.text;
            
            const toolUseBlock = data.content.find((c: any) => c.type === 'tool_use');
            if (toolUseBlock) {
                functionCall = {
                    name: toolUseBlock.name,
                    args: toolUseBlock.input
                };
            }
        }

        return {
            text: text,
            functionCall: functionCall,
            sourceModel: this.id,
            latencyMs: Date.now() - startTime,
            retries: 0
        };
    }
}
