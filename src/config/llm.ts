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

// Configurable Priority List
const DEFAULT_PRIORITY_LIST = [
    { provider: 'gemini', model: 'gemini-2.5-flash' },
    { provider: 'gemini', model: 'gemini-1.5-flash' },
    { provider: 'openrouter', model: 'openrouter/auto' }
];

export function buildConfig(): OrchestratorConfig {
    const priorityModels: ModelConfig[] = [];
    
    // Check if user provided a custom unified list, otherwise use default
    const customListStr = process.env.MODEL_PRIORITY_LIST;
    let listToUse = DEFAULT_PRIORITY_LIST;
    
    if (customListStr) {
        try {
            // Support simple comma-separated format: "gemini:gemini-1.5-flash,openrouter:deepseek/deepseek-v3:free"
            listToUse = customListStr.split(',').map(m => {
                const parts = m.trim().split(':');
                return { provider: parts[0] as ProviderId, model: parts.slice(1).join(':') };
            });
        } catch (e) {
            console.error("Failed to parse custom MODEL_PRIORITY_LIST", e);
        }
    }

    listToUse.forEach(item => {
        const providerId = parseProvider(item.provider);
        const hasKey = !!getApiKey(providerId);
        
        priorityModels.push({
            id: `${providerId}:${item.model}`,
            provider: providerId,
            modelName: item.model,
            baseURL: providerId === 'openrouter' ? 'https://openrouter.ai/api/v1' : undefined,
            isConfigured: hasKey
        });
    });

    return {
        priorityModels,
        maxRetries: parseInt(process.env.MAX_RETRIES || '2', 10),
        cooldownMs: parseInt(process.env.COOLDOWN_SECONDS || '60', 10) * 1000,
        timeoutMs: parseInt(process.env.TIMEOUT_SECONDS || '30', 10) * 1000,
    };
}

export const llmConfig = buildConfig();
