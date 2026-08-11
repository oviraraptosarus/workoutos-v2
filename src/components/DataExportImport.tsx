'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Download, Upload, CheckCircle2, AlertTriangle, Loader2, FileJson, ShieldCheck } from 'lucide-react';

const EXPORT_TABLES = [
    { key: 'daily_logs',           label: 'Daily Journal & Sleep' },
    { key: 'workout_logs',         label: 'Workout Logs' },
    { key: 'workout_templates',    label: 'Workout Templates' },
    { key: 'tasks',                label: 'Tasks & Planner' },
    { key: 'meal_entries',         label: 'Meal Entries' },
    { key: 'food_log',             label: 'Food Log' },
    { key: 'ai_memories',          label: 'Ava AI Memories' },
    { key: 'budget_entries',       label: 'Budget Entries' },
    { key: 'water_logs',           label: 'Water Logs' },
    { key: 'command_center_items', label: 'Command Center Items' },
];

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function DataExportImport() {
    const { user } = useAuth();
    const [exportStatus, setExportStatus] = useState<Status>('idle');
    const [importStatus, setImportStatus] = useState<Status>('idle');
    const [importMessage, setImportMessage] = useState('');
    const [exportSize, setExportSize] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        if (!user) return;
        setExportStatus('loading');
        setExportSize(null);
        try {
            const payload: Record<string, any> = {
                _meta: {
                    exported_at: new Date().toISOString(),
                    user_id: user.id,
                    app: 'Workout OS v2',
                    version: 1,
                },
            };
            await Promise.all(
                EXPORT_TABLES.map(async ({ key }) => {
                    const { data, error } = await supabase.from(key).select('*').eq('user_id', user.id);
                    payload[key] = error ? [] : (data ?? []);
                })
            );
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profile) payload['profile'] = [profile];

            const json = JSON.stringify(payload, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = workout-os-export-.json;
            a.click();
            URL.revokeObjectURL(url);
            setExportSize(${(blob.size / 1024).toFixed(1)} KB);
            setExportStatus('success');
            setTimeout(() => setExportStatus('idle'), 4000);
        } catch (e: any) {
            alert('Export failed: ' + e.message);
            setExportStatus('error');
            setTimeout(() => setExportStatus('idle'), 3000);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setImportStatus('loading');
        setImportMessage('Reading file...');
        try {
            const parsed = JSON.parse(await file.text());
            if (!parsed._meta || parsed._meta.app !== 'Workout OS v2') {
                throw new Error('Not a valid Workout OS export file.');
            }
            if (parsed._meta.user_id !== user.id) {
                const ok = confirm('This backup is from a different account. Importing will overwrite your current data. Continue?');
                if (!ok) { setImportStatus('idle'); return; }
            }
            let totalRows = 0;
            const errors: string[] = [];
            for (const { key } of EXPORT_TABLES) {
                const rows: any[] = parsed[key];
                if (!Array.isArray(rows) || rows.length === 0) continue;
                const stamped = rows.map((r) => ({ ...r, user_id: user.id }));
                const { error } = await supabase.from(key).upsert(stamped, { ignoreDuplicates: false });
                if (error) errors.push(${key}: );
                else totalRows += stamped.length;
            }
            setImportMessage(Imported  records.);
            setImportStatus('success');
            setTimeout(() => { setImportStatus('idle'); setImportMessage(''); }, 6000);
        } catch (err: any) {
            alert('Import failed: ' + err.message);
            setImportStatus('error');
            setImportMessage(err.message);
            setTimeout(() => { setImportStatus('idle'); setImportMessage(''); }, 4000);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col gap-4 px-1">
            <div className="flex items-start gap-3 bg-secondary/8 border border-secondary/20 rounded-2xl p-4">
                <ShieldCheck className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <p className="text-xs text-on-surface-variant leading-relaxed">
                    Your export includes journal entries, workouts, meals, tasks, sleep data, and Ava's memories.
                    Imports will upsert (add or overwrite) matching records — no data is permanently deleted.
                </p>
            </div>
            <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-surface-variant/30">
                <div className="px-4 pt-4 pb-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Included in export</p>
                </div>
                <div className="grid grid-cols-2 gap-0 pb-3 px-4">
                    {EXPORT_TABLES.map(({ label }) => (
                        <div key={label} className="flex items-center gap-1.5 py-1">
                            <div className="w-1 h-1 rounded-full bg-secondary/60 shrink-0" />
                            <span className="text-[11px] text-on-surface/70 font-medium">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <button
                onClick={handleExport}
                disabled={exportStatus === 'loading'}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/20 flex items-center justify-center">
                        {exportStatus === 'loading' ? <Loader2 className="w-4 h-4 text-secondary animate-spin" />
                         : exportStatus === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                         : <Download className="w-4 h-4 text-secondary" />}
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-bold text-on-surface">
                            {exportStatus === 'loading' ? 'Preparing export...' : exportStatus === 'success' ? 'Downloaded!' : 'Export All Data'}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">{exportSize ? ${exportSize} JSON file : 'Downloads a .json backup file'}</p>
                    </div>
                </div>
                <FileJson className="w-4 h-4 text-secondary/50" />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importStatus === 'loading'}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-surface-variant/40 hover:bg-surface-container active:scale-[0.98] transition-all disabled:opacity-50"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-variant/40 flex items-center justify-center">
                        {importStatus === 'loading' ? <Loader2 className="w-4 h-4 text-on-surface-variant animate-spin" />
                         : importStatus === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                         : importStatus === 'error' ? <AlertTriangle className="w-4 h-4 text-red-400" />
                         : <Upload className="w-4 h-4 text-on-surface-variant" />}
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-bold text-on-surface">
                            {importStatus === 'loading' ? 'Importing...' : importStatus === 'success' ? 'Import complete!' : importStatus === 'error' ? 'Import failed' : 'Import Backup'}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">{importMessage || 'Select a .json file exported from Workout OS'}</p>
                    </div>
                </div>
                <FileJson className="w-4 h-4 text-on-surface-variant/40" />
            </button>
        </div>
    );
}
