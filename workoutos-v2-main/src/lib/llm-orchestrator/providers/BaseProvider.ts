import { CompletionRequest, CompletionResponse, ModelConfig, ProviderInterface, ProviderId } from '../types';

export class OrchestratorError extends Error {
    constructor(
        message: string, 
        public status: number, 
        public isRetryable: boolean
    ) {
        super(message);
        this.name = 'OrchestratorError';
    }
}

export abstract class BaseProvider implements ProviderInterface {
    id: ProviderId;
    protected modelConfig: ModelConfig;
    protected apiKey: string;
    
    // Status codes that warrant a failover/retry
    protected retryableCodes = new Set([429, 500, 502, 503, 504]);

    constructor(modelConfig: ModelConfig, apiKey: string) {
        this.id = modelConfig.provider;
        this.modelConfig = modelConfig;
        this.apiKey = apiKey;
    }

    abstract generateContent(model: string, request: CompletionRequest, signal?: AbortSignal): Promise<CompletionResponse>;

    protected handleResponseError(status: number, statusText: string, bodyText: string) {
        const isRetryable = this.retryableCodes.has(status);
        throw new OrchestratorError(`[${this.id}] HTTP ${status} ${statusText}: ${bodyText}`, status, isRetryable);
    }
}
