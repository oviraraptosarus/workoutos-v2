import { HealthMetrics } from './types';

// Extend globalThis to persist stats across Next.js HMR in dev
declare global {
    var __llmHealthStore: Map<string, HealthMetrics>;
}

export class HealthMonitor {
    private store: Map<string, HealthMetrics>;
    private failureThreshold = 3;

    constructor() {
        if (!globalThis.__llmHealthStore) {
            globalThis.__llmHealthStore = new Map();
        }
        this.store = globalThis.__llmHealthStore;
    }

    private getOrCreate(modelId: string): HealthMetrics {
        if (!this.store.has(modelId)) {
            this.store.set(modelId, {
                successes: 0,
                failures: 0,
                rateLimits: 0,
                timeouts: 0,
                totalLatencyMs: 0,
                lastFailureAt: null,
                isCooldown: false
            });
        }
        return this.store.get(modelId)!;
    }

    public recordSuccess(modelId: string, latencyMs: number) {
        const stats = this.getOrCreate(modelId);
        stats.successes++;
        stats.totalLatencyMs += latencyMs;
        stats.failures = 0; // Reset consecutive failures
        stats.isCooldown = false;
    }

    public recordFailure(modelId: string, reason: 'rate_limit' | 'timeout' | 'error') {
        const stats = this.getOrCreate(modelId);
        stats.failures++;
        stats.lastFailureAt = Date.now();

        if (reason === 'rate_limit') stats.rateLimits++;
        else if (reason === 'timeout') stats.timeouts++;

        if (stats.failures >= this.failureThreshold) {
            stats.isCooldown = true;
            console.warn(`[Orchestrator] Model ${modelId} marked as UNHEALTHY (Cooldown active).`);
        }
    }

    public isHealthy(modelId: string, cooldownMs: number): boolean {
        const stats = this.getOrCreate(modelId);
        if (!stats.isCooldown) return true;

        // Check if cooldown period has elapsed
        if (stats.lastFailureAt && Date.now() - stats.lastFailureAt > cooldownMs) {
            stats.isCooldown = false;
            stats.failures = 0; // Optimistic reset
            console.info(`[Orchestrator] Model ${modelId} recovered from cooldown.`);
            return true;
        }

        return false;
    }

    public getStats(): Record<string, HealthMetrics> {
        const result: Record<string, HealthMetrics> = {};
        for (const [key, value] of this.store.entries()) {
            result[key] = { ...value };
        }
        return result;
    }

    public getHealthSummary() {
        const summary: any = {};
        for (const [key, stats] of this.store.entries()) {
            const totalAttempts = stats.successes + stats.failures;
            const successRate = totalAttempts > 0 ? (stats.successes / totalAttempts) * 100 : 100;
            const avgLatency = stats.successes > 0 ? (stats.totalLatencyMs / stats.successes) : 0;
            summary[key] = {
                successRate: `${successRate.toFixed(1)}%`,
                averageLatencyMs: avgLatency.toFixed(0),
                consecutiveFailures: stats.failures,
                status: stats.isCooldown ? 'COOLDOWN' : 'HEALTHY'
            };
        }
        return summary;
    }
}
