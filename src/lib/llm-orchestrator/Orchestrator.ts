import { ConfigManager } from './ConfigManager';
import { HealthMonitor } from './HealthMonitor';
import { CompletionRequest, CompletionResponse, ModelConfig } from './types';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';

export class LLMOrchestrator {
    private config = ConfigManager.getConfig();
    private health = new HealthMonitor();
    
    // Simple sleep utility for exponential backoff
    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getProviderInstance(model: ModelConfig) {
        const apiKey = process.env[model.apiKeyEnv];
        if (!apiKey) {
            throw new Error(`Missing API Key: ${model.apiKeyEnv}`);
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
            if (!this.health.isHealthy(model.id, this.config.cooldownMs)) {
                console.info(`[Orchestrator] Skipping ${model.id} (Cooldown).`);
                continue;
            }

            try {
                let retries = 0;
                let attemptSuccess = false;

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
                        const isRetryable = error?.isRetryable;
                        const reason = error?.name === 'AbortError' ? 'timeout' : (error?.status === 429 ? 'rate_limit' : 'error');
                        
                        console.warn(`[Orchestrator] Attempt ${retries + 1} failed for ${model.id}. Reason: ${reason}. Retryable: ${isRetryable}`);

                        if (!isRetryable) {
                            // Non-retryable (e.g. 401, 400). Do NOT failover to next model. Surface immediately.
                            throw error;
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
            } catch (fatalError) {
                // Abort completely (auth error, invalid prompt, etc.)
                throw fatalError;
            }
        }

        throw new Error(`[Orchestrator] All models failed. Last error: ${lastError?.message}`);
    }
}

export const orchestrator = new LLMOrchestrator();
