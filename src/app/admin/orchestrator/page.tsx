'use client';
import { useEffect, useState } from 'react';
import { Activity, Server, AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface HealthStats {
    successes: number;
    failures: number;
    rateLimits: number;
    timeouts: number;
    totalLatencyMs: number;
    lastFailureAt: number | null;
    isCooldown: boolean;
}

export default function OrchestratorAdminPanel() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/orchestrator/health');
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 10000); // Auto refresh every 10s
        return () => clearInterval(interval);
    }, []);

    if (!data) return <div className="p-8 text-white">Loading...</div>;

    const { config, health } = data;

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Server className="text-secondary" />
                            LLM Orchestrator
                        </h1>
                        <p className="text-neutral-400 mt-2">Live Health & Diagnostics Panel</p>
                    </div>
                    <button 
                        onClick={fetchHealth}
                        className="p-3 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-neutral-800/50 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-sm text-neutral-400 font-medium">Max Retries</h3>
                        <p className="text-2xl font-bold mt-2">{config.maxRetries}</p>
                    </div>
                    <div className="bg-neutral-800/50 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-sm text-neutral-400 font-medium">Cooldown Period</h3>
                        <p className="text-2xl font-bold mt-2">{config.cooldownMs / 1000}s</p>
                    </div>
                    <div className="bg-neutral-800/50 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-sm text-neutral-400 font-medium">Timeout</h3>
                        <p className="text-2xl font-bold mt-2">{config.timeoutMs / 1000}s</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Model Pool (Priority Order)
                    </h2>
                    
                    <div className="space-y-4">
                        {config.priorityModels.map((model: any, index: number) => {
                            const modelId = model.id;
                            const stats: HealthStats = health[modelId] || {
                                successes: 0, failures: 0, rateLimits: 0, timeouts: 0, totalLatencyMs: 0, isCooldown: false
                            };
                            
                            const avgLatency = stats.successes > 0 
                                ? Math.round(stats.totalLatencyMs / stats.successes) 
                                : 0;

                            const isUnconfigured = !model.isConfigured;
                            const statusColor = isUnconfigured ? 'text-neutral-600 bg-neutral-800' : stats.isCooldown ? 'text-white bg-white/10' : 'text-white bg-white/10';
                            const StatusIcon = isUnconfigured ? AlertCircle : stats.isCooldown ? XCircle : CheckCircle;

                            return (
                                <div key={modelId} className={`p-6 rounded-2xl border flex flex-col md:flex-row gap-6 justify-between items-center ${isUnconfigured ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-800/30 border-white/5'}`}>
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className={`p-3 rounded-full ${statusColor}`}>
                                            <StatusIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-neutral-500">#{index + 1}</span>
                                                <h3 className={`text-lg font-bold ${isUnconfigured ? 'text-neutral-500' : ''}`}>{modelId}</h3>
                                            </div>
                                            <p className="text-sm text-neutral-400">
                                                {isUnconfigured ? <span className="text-white">Missing API Key</span> : stats.isCooldown ? 'Currently on Cooldown' : 'Healthy & Active'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-auto text-center md:text-left">
                                        <div>
                                            <p className="text-xs text-neutral-500 uppercase font-bold">Success</p>
                                            <p className="text-xl font-medium text-white">{stats.successes}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-500 uppercase font-bold">429s</p>
                                            <p className="text-xl font-medium text-white">{stats.rateLimits}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-500 uppercase font-bold">Timeouts</p>
                                            <p className="text-xl font-medium text-white">{stats.timeouts}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-500 uppercase font-bold">Avg Latency</p>
                                            <p className="text-xl font-medium text-white">{avgLatency > 0 ? `${avgLatency}ms` : '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
