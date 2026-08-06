import { ProviderId, ModelConfig, OrchestratorConfig } from '@/lib/llm-orchestrator/types';

function parseProvider(id: string): ProviderId {
    const p = id.toLowerCase();
    if (['gemini', 'openai', 'anthropic', 'openrouter', 'agentrouter', 'openai-compatible'].includes(p)) {
        return p as ProviderId;
    }
    return 'openai-compatible';
}

function getApiKey(provider: ProviderId): string | undefined {
    switch (provider) {
        case 'gemini': return process.env.GEMINI_API_KEY;
        case 'openai': return process.env.OPENAI_API_KEY;
        case 'anthropic': return process.env.ANTHROPIC_API_KEY;
        case 'openrouter': return process.env.OPENROUTER_API_KEY;
        case 'agentrouter': return process.env.AGENTROUTER_API_KEY;
        default: return process.env[`${provider.toUpperCase()}_API_KEY`];
    }
}

export function buildConfig(): OrchestratorConfig {
    const primaryProvider = parseProvider(process.env.PRIMARY_PROVIDER || 'gemini');
    const primaryModel = process.env.PRIMARY_MODEL || 'gemini-2.5-flash';
    
    const priorityModels: ModelConfig[] = [];

    // Add Primary
    priorityModels.push({
        id: `${primaryProvider}:${primaryModel}`,
        provider: primaryProvider,
        modelName: primaryModel,
        isConfigured: !!getApiKey(primaryProvider)
    });

    // Add OpenRouter Fallbacks if defined
    const openRouterModelsStr = process.env.OPENROUTER_MODELS;
    if (openRouterModelsStr) {
        const orModels = openRouterModelsStr.split(',').map(m => m.trim()).filter(Boolean);
        const hasKey = !!getApiKey('openrouter');
        
        orModels.forEach(model => {
            priorityModels.push({
                id: `openrouter:${model}`,
                provider: 'openrouter',
                modelName: model,
                baseURL: 'https://openrouter.ai/api/v1',
                isConfigured: hasKey
            });
        });
    }

    return {
        priorityModels,
        maxRetries: parseInt(process.env.MAX_RETRIES || '2', 10),
        cooldownMs: parseInt(process.env.COOLDOWN_SECONDS || '60', 10) * 1000,
        timeoutMs: parseInt(process.env.TIMEOUT_SECONDS || '30', 10) * 1000,
    };
}

export const llmConfig = buildConfig();
