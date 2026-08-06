/* eslint-disable @typescript-eslint/no-explicit-any */
import { llmConfig } from '@/config/llm';
import { HealthMonitor } from './HealthMonitor';
import { CompletionRequest, CompletionResponse, ModelConfig } from './types';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';

export class LLMOrchestrator {
    private config = llmConfig;
    private health = new HealthMonitor();
    
    // Simple sleep utility for exponential backoff
    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getProviderInstance(model: ModelConfig) {
        let apiKey = '';
        switch (model.provider) {
            case 'gemini': apiKey = process.env.GEMINI_API_KEY || ''; break;
            case 'openai': apiKey = process.env.OPENAI_API_KEY || ''; break;
            case 'anthropic': apiKey = process.env.ANTHROPIC_API_KEY || ''; break;
            case 'openrouter': apiKey = process.env.OPENROUTER_API_KEY || ''; break;
            case 'agentrouter': apiKey = process.env.AGENTROUTER_API_KEY || ''; break;
            default: apiKey = process.env[`${model.provider.toUpperCase()}_API_KEY`] || ''; break;
        }

        if (!apiKey) {
            throw new Error(`Missing API Key for provider: ${model.provider}`);
        }

        switch (model.provider) {
            case 'gemini':
                return new GeminiProvider(model, apiKey);
            case 'openai':
            case 'openai-compatible':
            case 'openrouter':
            case 'agentrouter':
                return new OpenAIProvider(model, apiKey);
            case 'anthropic':
                return new AnthropicProvider(model, apiKey);
            default:
                throw new Error(`Unsupported provider: ${model.provider}`);
        }
    }

    public async generateContent(request: CompletionRequest): Promise<CompletionResponse> {
        let lastError: Error | null = null;

        for (const model of this.config.priorityModels) {
            if (!model.isConfigured) {
                console.info(`[Orchestrator] Skipping ${model.id} (Unconfigured API Key).`);
                continue;
            }

            if (!this.health.isHealthy(model.id, this.config.cooldownMs)) {
                console.info(`[Orchestrator] Skipping ${model.id} (Cooldown).`);
                continue;
            }

            try {
                let retries = 0;
                const attemptSuccess = false;

                while (retries <= this.config.maxRetries && !attemptSuccess) {
                    try {
                        const provider = this.getProviderInstance(model);
                        
                        // Use AbortController for timeout
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

                        const startTime = Date.now();
                        const response = await provider.generateContent(model.modelName, request, controller.signal);
                        const latencyMs = Date.now() - startTime;
                        
                        clearTimeout(timeoutId);

                        // Success
                        this.health.recordSuccess(model.id, latencyMs);
                        return { ...response, sourceModel: model.id, retries };

                    } catch (error: any) {
                        const isAbort = error?.name === 'AbortError';
                        const isExplicitlyNonRetryable = error?.isRetryable === false;
                        const reason = isAbort ? 'timeout' : (error?.status === 429 ? 'rate_limit' : 'error');
                        
                        console.warn(`[Orchestrator] Attempt ${retries + 1} failed for ${model.id}. Reason: ${reason}.`);

                        if (isAbort || isExplicitlyNonRetryable) {
                            // Don't retry the same model. Failover to the next fallback model immediately.
                            console.warn(`[Orchestrator] Skipping further retries on ${model.id}. Failing over.`);
                            this.health.recordFailure(model.id, reason);
                            lastError = error;
                            break;
                        }

                        retries++;
                        
                        // Exponential backoff before next internal retry on the SAME model
                        if (retries <= this.config.maxRetries) {
                            const backoffMs = Math.pow(2, retries) * 125; // 250ms, 500ms...
                            await this.sleep(backoffMs);
                        } else {
                            // Exhausted retries for this model.
                            this.health.recordFailure(model.id, reason);
                            lastError = error;
                        }
                    }
                }
            } catch (fatalError: any) {
                console.error(`[Orchestrator] Fatal error evaluating ${model.id}:`, fatalError);
                lastError = fatalError;
                // Continue to the next fallback model instead of aborting the pipeline
            }
        }

        // If all models fail, return friendly fallback message
        console.error(`[Orchestrator] All models exhausted or failed. Last error: ${lastError?.message}`);
        return {
            text: "Failed to process request. Please try again later.",
            sourceModel: "fallback",
            latencyMs: 0,
            retries: 0
        };
    }
}

export const orchestrator = new LLMOrchestrator();
