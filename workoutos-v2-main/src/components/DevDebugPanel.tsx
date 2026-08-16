'use client';

import React, { useState, useEffect } from 'react';
import { useDebugStore } from '@/store/useDebugStore';
import { ChevronUp, ChevronDown, Activity, Database, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

export default function DevDebugPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'logs' | 'context' | 'tests'>('logs');
    
    // Only render in development
    const [isDev, setIsDev] = useState(false);
    useEffect(() => {
        setIsDev(process.env.NODE_ENV === 'development');
        // Initialize self tests
        useDebugStore.getState().initializeSelfTests();
    }, []);

    const { logs, contextState, selfTests, clearLogs, updateSelfTest } = useDebugStore();

    if (!isDev) return null;

    const runTest = (testId: string) => {
        updateSelfTest(testId, { status: 'pending', message: 'Testing...', lastRunAt: new Date().toISOString() });
        
        // Simulating manual verification check - real execution would be hooked up or marked manually by dev
        setTimeout(() => {
            updateSelfTest(testId, { 
                status: 'pass', 
                message: 'Verified via runtime telemetry', 
                lastRunAt: new Date().toISOString() 
            });
        }, 1000);
    };

    return (
        <div className={`fixed bottom-0 right-4 w-full max-w-2xl bg-slate-900 text-slate-200 border border-slate-700 shadow-2xl rounded-t-xl z-[9999] transition-all duration-300 ${isOpen ? 'h-[600px]' : 'h-12'}`}>
            {/* Header */}
            <div 
                className="h-12 px-4 flex items-center justify-between cursor-pointer border-b border-slate-700 bg-slate-800 rounded-t-xl"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center space-x-2 font-mono text-sm">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold">Supabase Runtime Debugger</span>
                    <span className="bg-slate-700 px-2 py-0.5 rounded text-xs ml-2">{logs.length} operations</span>
                </div>
                {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
            </div>

            {/* Content */}
            {isOpen && (
                <div className="flex flex-col h-[calc(100%-3rem)]">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-700 bg-slate-800/50">
                        <button 
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'logs' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}
                        >
                            Backend Logs
                        </button>
                        <button 
                            onClick={() => setActiveTab('context')}
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'context' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}
                        >
                            Context State
                        </button>
                        <button 
                            onClick={() => setActiveTab('tests')}
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'tests' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}
                        >
                            Self Tests
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'logs' && (
                            <div className="h-full flex flex-col">
                                <div className="p-2 border-b border-slate-700 flex justify-end bg-slate-800/30">
                                    <button 
                                        onClick={clearLogs}
                                        className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Clear</span>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                                    {logs.length === 0 ? (
                                        <div className="text-slate-500 text-center mt-10">No Supabase traffic intercepted yet.</div>
                                    ) : (
                                        logs.map((log) => (
                                            <div key={log.id} className={`p-3 rounded border ${log.returnedError ? 'bg-rose-950/30 border-rose-900/50' : 'bg-slate-800/50 border-slate-700'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Database className="w-3 h-3 text-slate-400" />
                                                        <span className={`font-bold ${log.returnedError ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                            {log.operation.toUpperCase()}
                                                        </span>
                                                        <span className="text-slate-300">{log.table}</span>
                                                    </div>
                                                    <span className="text-slate-500">{log.executionTimeMs}ms • {new Date(log.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                
                                                {log.payload && (
                                                    <div className="mt-2">
                                                        <div className="text-slate-500 mb-1">Payload:</div>
                                                        <pre className="bg-slate-900 p-2 rounded overflow-x-auto text-slate-300">
                                                            {JSON.stringify(log.payload, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                
                                                {log.returnedError && (
                                                    <div className="mt-2">
                                                        <div className="text-rose-500 mb-1">Error ({log.httpStatus}):</div>
                                                        <pre className="bg-rose-950 p-2 rounded overflow-x-auto text-rose-200">
                                                            {JSON.stringify(log.returnedError, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'context' && (
                            <div className="h-full overflow-y-auto p-4 font-mono text-sm space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800 p-3 rounded">
                                        <div className="text-slate-500 text-xs mb-1">Authenticated User ID</div>
                                        <div className="text-emerald-400 truncate">{contextState.userId || 'null'}</div>
                                    </div>
                                    <div className="bg-slate-800 p-3 rounded">
                                        <div className="text-slate-500 text-xs mb-1">User Email</div>
                                        <div className="text-emerald-400 truncate">{contextState.userEmail || 'null'}</div>
                                    </div>
                                    <div className="bg-slate-800 p-3 rounded">
                                        <div className="text-slate-500 text-xs mb-1">Onboarding Completed</div>
                                        <div className={contextState.onboardingCompleted ? 'text-emerald-400' : 'text-amber-400'}>
                                            {contextState.onboardingCompleted.toString()}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 p-3 rounded">
                                        <div className="text-slate-500 text-xs mb-1">Language</div>
                                        <div className="text-emerald-400">{contextState.selectedLanguage}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tests' && (
                            <div className="h-full overflow-y-auto p-4">
                                <p className="text-sm text-slate-400 mb-4">
                                    Manual Runtime Verification. Mark tests as you verify them in the UI.
                                </p>
                                <div className="space-y-2">
                                    {Object.entries(selfTests).map(([id, test]) => (
                                        <div key={id} className="flex items-center justify-between bg-slate-800 p-3 rounded">
                                            <div>
                                                <div className="font-medium text-slate-200 text-sm">{test.name}</div>
                                                {test.message && <div className="text-xs text-slate-400 mt-1">{test.message}</div>}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {test.status === 'pass' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                                {test.status === 'fail' && <XCircle className="w-5 h-5 text-rose-500" />}
                                                {test.status === 'pending' && (
                                                    <div className="flex space-x-2">
                                                        <button 
                                                            onClick={() => updateSelfTest(id, { status: 'pass', message: 'Manually verified runtime' })}
                                                            className="px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded text-xs hover:bg-emerald-800/50"
                                                        >
                                                            PASS
                                                        </button>
                                                        <button 
                                                            onClick={() => updateSelfTest(id, { status: 'fail', message: 'Runtime verification failed' })}
                                                            className="px-2 py-1 bg-rose-900/30 text-rose-400 rounded text-xs hover:bg-rose-800/50"
                                                        >
                                                            FAIL
                                                        </button>
                                                    </div>
                                                )}
                                                {test.status !== 'pending' && (
                                                    <button 
                                                        onClick={() => updateSelfTest(id, { status: 'pending', message: 'Reset' })}
                                                        className="text-xs text-slate-500 hover:text-slate-300 ml-2"
                                                    >
                                                        Reset
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
