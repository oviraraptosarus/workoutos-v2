export type ProviderId = 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'agentrouter' | 'openai-compatible';

export interface ModelConfig {
    id: string; // e.g. "openai:gpt-4o" or "gemini:gemini-2.0-flash"
    provider: ProviderId;
    modelName: string; // e.g. "gpt-4o"
    apiKeyEnv: string;
    baseURL?: string; // useful for OpenRouter, AgentRouter, etc.
}

export interface OrchestratorConfig {
    priorityModels: ModelConfig[];
    maxRetries: number;
    cooldownMs: number;
    timeoutMs: number;
}

export interface CompletionRequest {
    systemInstruction?: string;
    prompt: string;
    image?: string; // base64 data URI
    history?: { role: 'user' | 'model'; text: string; imageUrl?: string }[];
    temperature?: number;
    maxOutputTokens?: number;
    tools?: any[]; // Simplified for this implementation
    responseFormat?: 'text' | 'json'; // Force JSON output
}

export interface CompletionResponse {
    text: string;
    functionCall?: any;
    sourceModel: string;
    latencyMs: number;
    retries: number;
}

export interface HealthMetrics {
    successes: number;
    failures: number;
    rateLimits: number;
    timeouts: number;
    totalLatencyMs: number;
    lastFailureAt: number | null;
    isCooldown: boolean;
}

export interface ProviderInterface {
    id: ProviderId;
    generateContent(model: string, request: CompletionRequest, signal?: AbortSignal): Promise<CompletionResponse>;
}
