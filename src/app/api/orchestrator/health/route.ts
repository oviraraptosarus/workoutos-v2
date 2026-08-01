import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/llm-orchestrator/Orchestrator';
import { ConfigManager } from '@/lib/llm-orchestrator/ConfigManager';

export async function GET(req: Request) {
    try {
        // In a real production app, you would add authentication here
        // to ensure only admins can view the orchestrator health.
        
        const config = ConfigManager.getConfig();
        // We have to access health monitor via the orchestrator instance
        // I will add a method to get stats.
        
        const healthStats = (orchestrator as any).health.getStats();

        return NextResponse.json({
            config: {
                priorityModels: config.priorityModels.map(m => m.id),
                maxRetries: config.maxRetries,
                cooldownMs: config.cooldownMs,
                timeoutMs: config.timeoutMs
            },
            health: healthStats,
            status: 'online'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
