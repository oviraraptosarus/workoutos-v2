import { OrchestratorConfig, ModelConfig, ProviderId } from './types';

function parseProvider(id: string): ProviderId {
    const p = id.toLowerCase();
    if (['gemini', 'openai', 'anthropic', 'openrouter', 'agentrouter', 'openai-compatible'].includes(p)) {
        return p as ProviderId;
    }
    return 'openai-compatible';
}

export class ConfigManager {
    static getConfig(): OrchestratorConfig {
        // e.g. "gemini:gemini-2.0-flash,openai:gpt-4o,anthropic:claude-3-5-sonnet,openrouter:auto"
        const modelsStr = process.env.LLM_MODELS_PRIORITY || 'gemini:gemini-2.0-flash,gemini:gemini-1.5-flash';
        
        const priorityModels: ModelConfig[] = modelsStr.split(',').map((m) => {
            const parts = m.trim().split(':');
            const providerStr = parts.length > 1 ? parts[0] : 'gemini';
            const modelName = parts.length > 1 ? parts.slice(1).join(':') : parts[0];
            
            const provider = parseProvider(providerStr);
            let apiKeyEnv = `${provider.toUpperCase()}_API_KEY`;
            if (provider === 'gemini') apiKeyEnv = 'GEMINI_API_KEY';
            
            let baseURL = undefined;
            if (provider === 'openrouter') {
                baseURL = 'https://openrouter.ai/api/v1';
                apiKeyEnv = 'OPENROUTER_API_KEY';
            } else if (provider === 'agentrouter') {
                baseURL = 'https://agentrouter.com/api/v1'; // Assuming generic standard
                apiKeyEnv = 'AGENTROUTER_API_KEY';
            }

            return {
                id: `${provider}:${modelName}`,
                provider,
                modelName,
                apiKeyEnv,
                baseURL
            };
        });

        return {
            priorityModels,
            maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '2', 10),
            cooldownMs: parseInt(process.env.LLM_COOLDOWN_MS || '60000', 10),
            timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || '15000', 10),
        };
    }
}
