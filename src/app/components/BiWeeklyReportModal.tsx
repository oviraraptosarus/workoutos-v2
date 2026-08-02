'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarDays, Sparkles, TrendingUp, AlertCircle, Download, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { supabase } from '@/lib/supabaseClient';

interface BiWeeklyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const REPORT_STORAGE_KEY = 'workout_os_biweekly_report';
const REPORT_DATE_KEY = 'workout_os_biweekly_report_date';

export default function BiWeeklyReportModal({ isOpen, onClose }: BiWeeklyReportModalProps) {
    const { userProfile } = useAuth();
    const { selectedDate } = useDate();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [generationDate, setGenerationDate] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        // Load report from persistent storage
        const savedReport = localStorage.getItem(REPORT_STORAGE_KEY);
        const savedDate = localStorage.getItem(REPORT_DATE_KEY);

        if (savedReport && savedDate) {
            const reportDate = new Date(savedDate);
            const now = new Date();
            const daysSinceGeneration = (now.getTime() - reportDate.getTime()) / (1000 * 3600 * 24);

            if (daysSinceGeneration > 7) {
                // Auto-delete after 7 days
                localStorage.removeItem(REPORT_STORAGE_KEY);
                localStorage.removeItem(REPORT_DATE_KEY);
                setReport(null);
                setGenerationDate(null);
            } else {
                setReport(savedReport);
                setGenerationDate(savedDate);
            }
        }
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const parseMarkdown = (text: string) => {
        let html = text
            .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-6 mb-3 flex items-center gap-2 border-b border-surface-variant  pb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-on-surface dark:text-white mt-6 mb-3">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-on-surface dark:text-white mb-4">$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-on-surface dark:text-white">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic text-on-surface-variant dark:text-on-surface-variant">$1</em>')
            .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-sm text-on-surface-variant dark:text-on-surface-variant leading-relaxed mb-2">$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-sm text-on-surface-variant dark:text-on-surface-variant leading-relaxed mb-2 font-medium">$1</li>')
            .replace(/\n/g, '<br />');

        html = html.replace(/<br \/><li/g, '<li');
        html = html.replace(/<\/li><br \/>/g, '</li>');

        return html;
    };

    const generateReport = async () => {
        setLoading(true);
        setError(null);
        setReport(null);

        try {
            const dEnd = new Date();
            const dStart = new Date();
            dStart.setDate(dStart.getDate() - 14);
            const startStr = dStart.toISOString().split('T')[0];
            const endStr = dEnd.toISOString().split('T')[0];

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const [logsRes, expensesRes, tasksRes] = await Promise.all([
                supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('date', startStr).lte('date', endStr),
                supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', startStr).lte('date', endStr),
                supabase.from('tasks').select('*').eq('user_id', user.id).gte('date', startStr).lte('date', endStr)
            ]);

            const historicalData = {
                dailyLogs: logsRes.data || [],
                transactions: expensesRes.data || [],
                tasks: tasksRes.data || []
            };

            const res = await fetch('/api/ai/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    historicalData,
                    userProfile,
                    apiKey: localStorage.getItem('workout_os_gemini_api_key') || undefined
                })
            });

            const data = await res.json();
            
            if (data.report) {
                const nowStr = new Date().toISOString();
                setReport(data.report);
                setGenerationDate(nowStr);
                
                // Save to persistent storage to simulate database row
                localStorage.setItem(REPORT_STORAGE_KEY, data.report);
                localStorage.setItem(REPORT_DATE_KEY, nowStr);
            } else {
                throw new Error(data.error || 'Failed to generate report');
            }

        } catch (err: any) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = () => {
        if (!report) return;
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WorkoutOS_Report_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const deleteReportEarly = () => {
        localStorage.removeItem(REPORT_STORAGE_KEY);
        localStorage.removeItem(REPORT_DATE_KEY);
        setReport(null);
        setGenerationDate(null);
    };

    // Calculate days remaining before auto-delete
    let daysRemaining = 0;
    if (generationDate) {
        const reportDate = new Date(generationDate);
        const now = new Date();
        const daysSince = (now.getTime() - reportDate.getTime()) / (1000 * 3600 * 24);
        daysRemaining = Math.max(0, Math.ceil(7 - daysSince));
    }

    const modalContent = (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-card-white  border border-surface-variant  rounded-3xl w-full max-w-2xl shadow-[0_25px_70px_0_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-surface-variant  bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-on-surface dark:text-white tracking-tight">
                                Bi-Weekly AI Report
                            </h2>
                            <p className="text-[11px] font-bold text-on-surface-variant dark:text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                                <CalendarDays size={12} /> Last 14 Days Analysis
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-surface-container-low dark:bg-surface-container-high hover:bg-surface-container dark:hover:bg-slate-700 text-on-surface-variant dark:text-on-surface-variant transition-colors btn-press"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {!report && !loading && !error && (
                        <div className="text-center py-10">
                            <div className="w-20 h-20 mx-auto bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                                <Sparkles size={32} className="text-blue-500 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-on-surface dark:text-white mb-2">Ready to crunch the numbers?</h3>
                            <p className="text-sm text-on-surface-variant dark:text-on-surface-variant mb-8 max-w-sm mx-auto leading-relaxed">
                                Nova will analyze your tracked data over the last 14 days to generate actionable insights. <br/><br/>
                                <strong className="text-on-surface-variant dark:text-on-surface-variant">Generated reports auto-delete after 7 days.</strong>
                            </p>
                            <button
                                onClick={generateReport}
                                className="bg-gray-900 dark:bg-card-white text-white dark:text-on-surface font-bold px-8 py-3.5 rounded-full hover:scale-105 transition-transform shadow-lg flex items-center gap-2 mx-auto"
                            >
                                <TrendingUp size={18} /> Generate New Report
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-16 space-y-4">
                            <div className="w-12 h-12 border-4 border-blue-100 dark:border-blue-900 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin mx-auto" />
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 animate-pulse">
                                Nova is analyzing your progress...
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl flex items-start gap-3 text-rose-800 dark:text-rose-300 text-sm">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <div>
                                <strong className="font-bold block mb-1">Analysis Failed</strong>
                                {error}
                            </div>
                        </div>
                    )}

                    {report && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low dark:bg-surface-container-high/50 p-3 rounded-2xl border border-surface-variant ">
                                <div className="text-xs font-bold text-on-surface-variant dark:text-on-surface-variant flex items-center gap-2">
                                    <AlertCircle size={14} className="text-orange-500" /> 
                                    Auto-deletes in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={deleteReportEarly}
                                        className="px-3 py-1.5 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                    <button
                                        onClick={downloadReport}
                                        className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                                    >
                                        <Download size={14} /> Download
                                    </button>
                                </div>
                            </div>

                            <div 
                                className="markdown-body text-sm p-2"
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(report) }}
                            />
                            
                            <div className="mt-8 pt-6 border-t border-surface-variant  flex justify-between items-center">
                                <span className="text-[10px] font-bold text-on-surface-variant dark:text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles size={12} className="text-blue-500" /> Powered by Nova AI
                                </span>
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2 bg-surface-container dark:bg-surface-container-high hover:bg-surface-container-high dark:hover:bg-slate-700 text-on-surface dark:text-white font-bold rounded-full text-xs transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
