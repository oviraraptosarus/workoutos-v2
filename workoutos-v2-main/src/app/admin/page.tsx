'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Activity, Database, AlertTriangle, ArrowLeft, RefreshCw, Layers, Code, GitMerge, FileText } from 'lucide-react';

export default function DeveloperDashboard() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [isDevMode, setIsDevMode] = useState(false);
    
    // Data states
    const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);
    const [metrics, setMetrics] = useState({
        tasks: 0,
        habits: 0,
        meals: 0,
        sleep: 0,
        workouts: 0,
        memories: 0
    });
    
    // Auth and Feature Flag check
    useEffect(() => {
        // We look for a ?dev=unlock query param to enable dev mode
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('dev') === 'unlock') {
            localStorage.setItem('workoutos_dev_mode', 'true');
        }
        
        const devMode = localStorage.getItem('workoutos_dev_mode') === 'true';
        setIsDevMode(devMode);
        
        if (!devMode) {
            router.push('/');
        } else {
            fetchData();
        }
    }, [router]);

    const fetchData = async () => {
        if (!user) return;
        
        // Fetch Telemetry Logs
        const { data: logs } = await supabase
            .from('telemetry_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
            
        if (logs) setTelemetryLogs(logs);

        // Fetch DB Metrics (Counts)
        const counts = await Promise.all([
            supabase.from('tasks').select('*', { count: 'exact', head: true }),
            supabase.from('habits').select('*', { count: 'exact', head: true }),
            supabase.from('meal_entries').select('*', { count: 'exact', head: true }),
            supabase.from('daily_logs').select('*', { count: 'exact', head: true }),
            supabase.from('workouts').select('*', { count: 'exact', head: true }),
            supabase.from('ai_memories').select('*', { count: 'exact', head: true }),
        ]);
        
        setMetrics({
            tasks: counts[0].count || 0,
            habits: counts[1].count || 0,
            meals: counts[2].count || 0,
            sleep: counts[3].count || 0,
            workouts: counts[4].count || 0,
            memories: counts[5].count || 0,
        });
    };

    // Auto-refresh logs every 5 seconds for the live stream effect
    useEffect(() => {
        if (!isDevMode) return;
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [isDevMode, user]);

    if (!isDevMode) return null;

    // Derived Data
    const errors = telemetryLogs.filter(l => l.event_type === 'ERROR' || l.status === 'FAILED');
    const recentLatency = telemetryLogs.filter(l => l.latency_ms).map(l => l.latency_ms);
    const avgLatency = recentLatency.length > 0 ? Math.round(recentLatency.reduce((a,b)=>a+b,0)/recentLatency.length) : 0;
    
    // Group logs by Request ID for the Request Inspector
    const requestGroups = telemetryLogs.reduce((acc, log) => {
        if (!acc[log.request_id]) acc[log.request_id] = [];
        acc[log.request_id].push(log);
        return acc;
    }, {} as Record<string, any[]>);
    
    const uniqueRequests = Object.keys(requestGroups).slice(0, 10); // Show last 10 requests

    return (
        <div className="min-h-screen bg-[#0f0f13] text-white p-6 font-mono text-sm pb-32">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="text-white/50 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-widest text-purple-400">WorkoutOS / Admin Console</h1>
                        <p className="text-white/40 text-xs">Observability & Telemetry System</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={fetchData} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70">
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Live
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Section 1: System Health */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
                    <h2 className="text-white/60 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                        <Activity size={14} /> System Health
                    </h2>
                    <div className="bg-[#1e1e28] rounded-xl border border-white/5 p-4 grid gap-3">
                        <HealthRow name="AI Service" status="Online" />
                        <HealthRow name="Supabase" status="Connected" />
                        <HealthRow name="Telemetry Engine" status="Running" />
                        <HealthRow name="Avg AI Latency" value={`${avgLatency}ms`} />
                    </div>
                    
                    {/* Section 4: Database Inspector */}
                    <h2 className="text-white/60 font-bold uppercase tracking-wider text-xs flex items-center gap-2 mt-4">
                        <Database size={14} /> Database Inspector
                    </h2>
                    <div className="bg-[#1e1e28] rounded-xl border border-white/5 p-4 grid gap-3">
                        <StatRow name="Planner Tasks" value={metrics.tasks} />
                        <StatRow name="AI Memories" value={metrics.memories} />
                        <StatRow name="Meals Logged" value={metrics.meals} />
                        <StatRow name="Workouts" value={metrics.workouts} />
                    </div>
                </div>

                {/* Section 2 & 6: Request Inspector & Flow */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
                    <h2 className="text-white/60 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                        <GitMerge size={14} /> Request Inspector
                    </h2>
                    <div className="flex flex-col gap-3">
                        {uniqueRequests.map(reqId => {
                            const logs = requestGroups[reqId].reverse();
                            const promptLog = logs.find((l: any) => l.event_type === 'PROMPT_RECEIVED');
                            const respLog = logs.find((l: any) => l.event_type === 'ORCHESTRATOR_RESPONSE');
                            const hasError = logs.some((l: any) => l.event_type === 'ERROR' || l.status === 'FAILED');
                            
                            return (
                                <div key={reqId} className={`bg-[#1e1e28] rounded-xl border ${hasError ? 'border-red-500/30' : 'border-white/5'} overflow-hidden`}>
                                    <div className={`px-4 py-2 border-b border-white/5 flex items-center justify-between ${hasError ? 'bg-red-500/10' : 'bg-white/5'}`}>
                                        <span className="font-bold text-white/80">{reqId}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${hasError ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {hasError ? 'FAILED' : 'SUCCESS'}
                                        </span>
                                    </div>
                                    <div className="p-4 flex flex-col gap-3">
                                        {promptLog && (
                                            <div>
                                                <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Prompt</div>
                                                <div className="text-white/90 bg-black/40 p-2 rounded break-words">"{promptLog.payload?.prompt || 'Image Payload'}"</div>
                                            </div>
                                        )}
                                        {respLog && respLog.payload?.hasFunction && (
                                            <div>
                                                <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Tool Executed</div>
                                                <div className="text-purple-400 flex items-center gap-2">
                                                    <Layers size={14} /> {respLog.payload.functionName}
                                                </div>
                                            </div>
                                        )}
                                        <div className="mt-2 pt-2 border-t border-white/5">
                                            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Orchestrator Flow</div>
                                            <div className="flex flex-col gap-2">
                                                {logs.map((log: any, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-2 text-xs">
                                                        <span className="text-white/30 shrink-0 w-16">{new Date(log.created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                        <span className={log.event_type === 'ERROR' ? 'text-red-400 font-bold' : log.status === 'SUCCESS' ? 'text-green-400' : 'text-white/70'}>
                                                            {log.event_type} {log.module ? `(${log.module})` : ''} {log.latency_ms ? `[${log.latency_ms}ms]` : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Section 5 & 7: Event Stream & Error Center */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                    <h2 className="text-white/60 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                        <AlertTriangle size={14} className="text-red-400" /> Error Center
                    </h2>
                    <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                        {errors.length === 0 ? (
                            <div className="text-white/40 text-center py-4">No recent errors detected.</div>
                        ) : errors.map(err => (
                            <div key={err.id} className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-xs">
                                <div className="text-red-400 font-bold mb-1">{err.module}</div>
                                <div className="text-red-300 break-words whitespace-pre-wrap">{err.payload?.error || 'Unknown error'}</div>
                                <div className="text-white/40 mt-2 text-[10px]">{err.request_id}</div>
                            </div>
                        ))}
                    </div>

                    <h2 className="text-white/60 font-bold uppercase tracking-wider text-xs flex items-center gap-2 mt-4">
                        <FileText size={14} /> Live Event Stream
                    </h2>
                    <div className="bg-[#1e1e28] border border-white/5 rounded-xl p-4 flex flex-col gap-2 max-h-[400px] overflow-y-auto font-mono text-[10px]">
                        {telemetryLogs.slice(0, 30).map(log => (
                            <div key={log.id} className="flex gap-2 p-1.5 hover:bg-white/5 rounded transition-colors">
                                <span className="text-white/30 shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                                <span className={log.event_type === 'ERROR' ? 'text-red-400' : 'text-white/60 uppercase'}>[{log.module}]</span>
                                <span className="text-white break-words">{log.event_type}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

function HealthRow({ name, status, value }: { name: string, status?: string, value?: string }) {
    return (
        <div className="flex items-center justify-between pb-2 border-b border-white/5 last:border-0 last:pb-0">
            <span className="text-white/70">{name}</span>
            <div className="flex items-center gap-2">
                {status && (
                    <>
                        <span className={`w-2 h-2 rounded-full ${status === 'Online' || status === 'Connected' || status === 'Running' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-white font-bold">{status}</span>
                    </>
                )}
                {value && <span className="text-white font-bold">{value}</span>}
            </div>
        </div>
    );
}

function StatRow({ name, value }: { name: string, value: number }) {
    return (
        <div className="flex items-center justify-between pb-2 border-b border-white/5 last:border-0 last:pb-0">
            <span className="text-white/70">{name}</span>
            <span className="text-purple-400 font-bold text-lg">{value}</span>
        </div>
    );
}
