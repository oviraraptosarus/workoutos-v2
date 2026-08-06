import React from 'react';
import { TelemetryEvent } from '@/services/telemetryEngine';

export interface AIDebugDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    contextStatus: Record<string, { loaded: boolean; query: string; error?: string }>;
    recentLogs?: TelemetryEvent[];
}

export function AIDebugDashboard({ isOpen, onClose, contextStatus, recentLogs }: AIDebugDashboardProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface border border-surface-border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-surface-border">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-on-surface">AI Debug Dashboard</h2>
                        <p className="text-sm text-on-surface-muted mt-1">Live Telemetry & Diagnostics</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-surface-hover rounded-full text-on-surface-muted hover:text-on-surface transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Environment Overview */}
                    <section>
                        <h3 className="text-sm font-semibold tracking-wide text-on-surface-muted uppercase mb-4">Environment</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-surface-hover p-4 rounded-2xl">
                                <p className="text-xs text-on-surface-muted mb-1">Provider</p>
                                <p className="text-sm font-medium text-on-surface">{process.env.NEXT_PUBLIC_PRIMARY_PROVIDER || 'Gemini'}</p>
                            </div>
                            <div className="bg-surface-hover p-4 rounded-2xl">
                                <p className="text-xs text-on-surface-muted mb-1">Model</p>
                                <p className="text-sm font-medium text-on-surface">{process.env.NEXT_PUBLIC_PRIMARY_MODEL || 'gemini-1.5-flash'}</p>
                            </div>
                            <div className="bg-surface-hover p-4 rounded-2xl">
                                <p className="text-xs text-on-surface-muted mb-1">API Keys</p>
                                <p className="text-sm font-medium text-green-500">Configured</p>
                            </div>
                            <div className="bg-surface-hover p-4 rounded-2xl">
                                <p className="text-xs text-on-surface-muted mb-1">Network</p>
                                <p className="text-sm font-medium text-green-500">Online</p>
                            </div>
                        </div>
                    </section>

                    {/* Context Load Status */}
                    <section>
                        <h3 className="text-sm font-semibold tracking-wide text-on-surface-muted uppercase mb-4">Context Retrieval Status</h3>
                        <div className="bg-surface-hover rounded-2xl overflow-hidden border border-surface-border">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-surface border-b border-surface-border text-on-surface-muted text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Module</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium">Query</th>
                                        <th className="px-4 py-3 font-medium">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border text-on-surface">
                                    {Object.entries(contextStatus).map(([module, status]) => (
                                        <tr key={module}>
                                            <td className="px-4 py-3 font-medium">{module}</td>
                                            <td className="px-4 py-3">
                                                {status.error ? (
                                                    <span className="inline-flex items-center gap-1.5 text-red-500 bg-red-500/10 px-2 py-1 rounded-md text-xs font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                        Failed
                                                    </span>
                                                ) : status.loaded ? (
                                                    <span className="inline-flex items-center gap-1.5 text-green-500 bg-green-500/10 px-2 py-1 rounded-md text-xs font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                        Loaded
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md text-xs font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-on-surface-muted">{status.query}</td>
                                            <td className="px-4 py-3 text-xs text-red-400 max-w-[200px] truncate" title={status.error}>{status.error || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Request Trace (if logs passed) */}
                    {recentLogs && recentLogs.length > 0 && (
                        <section>
                            <h3 className="text-sm font-semibold tracking-wide text-on-surface-muted uppercase mb-4">Request Trace</h3>
                            <div className="space-y-3">
                                {recentLogs.map((log, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-2xl bg-surface-hover border border-surface-border">
                                        <div className="flex-shrink-0 text-xs font-mono text-on-surface-muted w-32">
                                            {log.request_id}
                                        </div>
                                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <span className="font-semibold text-sm text-on-surface mr-2">{log.event_type}</span>
                                                <span className="text-xs text-on-surface-muted">[{log.module}]</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-mono">
                                                {log.latency_ms && <span className="text-on-surface-muted">{log.latency_ms}ms</span>}
                                                <span className={`px-2 py-0.5 rounded-md ${log.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' : log.status === 'FAILED' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                        </div>
                                        {log.payload?.error && (
                                            <div className="w-full text-xs font-mono text-red-400 bg-red-950/20 p-2 rounded mt-2 break-all">
                                                {log.payload.error}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
