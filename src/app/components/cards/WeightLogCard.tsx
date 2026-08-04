'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, ChevronRight, Camera } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ProgressPhotosRow, { ProgressPhotoItem } from '@/components/progress/ProgressPhotosRow';
import ProgressPhotoGalleryModal from '@/components/progress/ProgressPhotoGalleryModal';
import WeightWeighInPromptModal from '@/components/progress/WeightWeighInPromptModal';

interface WeightEntry {
    date: string;
    weight: number;
}

const WEIGHT_KEY = 'workout_os_weight_log';

export default function WeightLogCard() {
    const { userProfile } = useAuth();
    const { t } = useLanguage();
    const [weight, setWeight] = useState<number | string>(userProfile?.currentWeight || 75);
    const [isLogged, setIsLogged] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    const [chartData, setChartData] = useState<WeightEntry[]>([]);

    // Progress photos state
    const [photos, setPhotos] = useState<ProgressPhotoItem[]>([]);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryInitialPhotoId, setGalleryInitialPhotoId] = useState<string | undefined>(undefined);
    const [showWeighInPrompt, setShowWeighInPrompt] = useState(false);

    const fetchPhotos = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
            .from('progress_photos')
            .select('*')
            .eq('user_id', user.id)
            .order('uploaded_at', { ascending: true });
        if (error || !data) return;

        const loaded: ProgressPhotoItem[] = [];
        for (const row of data) {
            const { data: fileData } = await supabase.storage
                .from('progress_photos')
                .download(row.storage_path);
            if (fileData) {
                const displayLabel = new Date(row.taken_at || row.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                loaded.push({
                    id: row.id,
                    storage_path: row.storage_path,
                    uploaded_at: row.uploaded_at,
                    taken_at: row.taken_at,
                    weight_snapshot: row.weight_snapshot,
                    notes: row.notes,
                    dataUrl: URL.createObjectURL(fileData),
                    label: displayLabel
                });
            }
        }
        setPhotos(loaded);
    }, []);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const target = userProfile?.targetWeight || 75;
            const createdAt = userProfile?.createdAt ? new Date(userProfile.createdAt) : null;
            
            // Generate the current week (Monday to Sunday)
            const today = new Date();
            const currentDay = today.getDay();
            const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
            
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - diffToMonday);
            const startStr = startDate.getFullYear() + '-' + String(startDate.getMonth() + 1).padStart(2, '0') + '-' + String(startDate.getDate()).padStart(2, '0');
            
            const endDate = new Date(today);
            endDate.setDate(today.getDate() - diffToMonday + 6);
            const endStr = endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0') + '-' + String(endDate.getDate()).padStart(2, '0');

            const { data } = await supabase
                .from('daily_logs')
                .select('date, weight_kg')
                .eq('user_id', user.id)
                .gte('date', startStr)
                .lte('date', endStr)
                .not('weight_kg', 'is', null);

            const logMap = new Map();
            if (data) {
                data.forEach(d => {
                    const localDate = new Date(d.date);
                    const formattedDate = localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                    logMap.set(formattedDate, d.weight_kg);
                });
            }

            const currentWeekLogs: any[] = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - diffToMonday + i);
                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                currentWeekLogs.push({
                    date: dateStr,
                    weight: logMap.has(dateStr) ? logMap.get(dateStr) : null
                });
            }
            
            setChartData(currentWeekLogs);
        };
        load();
        window.addEventListener('storage', load);
        return () => window.removeEventListener('storage', load);
    }, [userProfile?.currentWeight, userProfile?.targetWeight]);

    const handleLog = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        
        const newWeight = Number(weight);
        if (!isNaN(newWeight)) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const d = new Date();
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const todayKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            
            try {
                // Upsert daily_logs
                const { data: existing, error: fetchError } = await supabase
                    .from('daily_logs')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('date', todayKey)
                    .maybeSingle();

                if (existing) {
                    const { error } = await supabase.from('daily_logs').update({ weight_kg: newWeight }).eq('id', existing.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('daily_logs').insert({ user_id: user.id, date: todayKey, weight_kg: newWeight });
                    if (error) throw error;
                }

                // Update profiles current_weight
                const { error: profileError } = await supabase.from('profiles').upsert({ id: user.id, current_weight: newWeight }, { onConflict: 'id' });
                if (profileError) throw profileError;

                let updated = [...chartData];
                // If they already logged today, update it instead of adding duplicate
                const idx = updated.findIndex(log => log.date === dateStr);
                if (idx !== -1) {
                    updated[idx].weight = newWeight;
                } else {
                    updated.push({ date: dateStr, weight: newWeight });
                    if (updated.length > 7) updated = updated.slice(updated.length - 7);
                }
                setChartData(updated);

                setIsLogged(true);
                setTimeout(() => setIsLogged(false), 3000);
                window.dispatchEvent(new Event('storage'));

                // 7-day prompt check for progress photo on weigh-in save
                const latestPhoto = photos[photos.length - 1];
                const nowMs = Date.now();
                const lastUploadMs = latestPhoto ? new Date(latestPhoto.uploaded_at).getTime() : 0;
                const daysDiff = (nowMs - lastUploadMs) / (1000 * 60 * 60 * 24);

                if (!latestPhoto || daysDiff > 7) {
                    setTimeout(() => setShowWeighInPrompt(true), 400);
                }
            } catch (err: any) {
                console.error('Error logging weight:', err);
                setErrorMsg(err.message || 'Failed to log weight');
            }
        }
    };

    return (
        <div className="bg-card-white dark:bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-black/5 dark:border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden transition-all hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[20px]">monitor_weight</span>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">{t('dash.weight')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setGalleryOpen(true)}
                        className="font-label-sm text-xs text-secondary hover:underline flex items-center gap-1 font-bold active:scale-90 transition-transform bg-secondary/10 px-2.5 py-1 rounded-full border border-secondary/20"
                        title="Progress Photos Gallery"
                    >
                        <Camera size={13} />
                        Photos
                    </button>
                    <Link href="/progress" aria-label="View weight progress" className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 active:scale-90 transition-transform">
                        Trend <ChevronRight size={16} />
                    </Link>
                </div>
            </div>

            <div className="h-40 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                            dy={5}
                            padding={{ left: 10, right: 10 }}
                        />
                        <YAxis 
                            domain={['dataMin - 1', 'dataMax + 1']} 
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold', backgroundColor: '#ffffff' }}
                            itemStyle={{ color: '#4f46e5' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#4f46e5" 
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1000}
                            connectNulls={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <form onSubmit={handleLog} className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            type="number"
                            step="0.1"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-4 py-3 font-display-lg text-2xl text-on-surface focus:outline-none focus:border-secondary transition-all text-center shadow-inner"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-sm text-sm text-on-surface-variant">kg</span>
                    </div>
                    <button 
                        type="submit"
                        disabled={isLogged}
                        className={`px-5 py-3 rounded-xl font-label-sm text-sm transition-all shadow-sm ${
                            isLogged ? 'bg-activity-green text-white' : 'bg-primary text-on-primary hover:opacity-90 btn-press'
                        }`}
                    >
                        {isLogged ? <CheckCircle2 size={24} /> : 'Save'}
                    </button>
                </div>
                {isLogged && (
                    <p className="font-label-sm text-[11px] text-activity-green text-center animate-in fade-in slide-in-from-top-1">
                        Weight successfully logged!
                    </p>
                )}
                {errorMsg && (
                    <p className="font-label-sm text-[11px] text-error text-center animate-in fade-in slide-in-from-top-1">
                        {errorMsg}
                    </p>
                )}
            </form>

            {/* Progress Photos Row Shortcut inside Weight Card */}
            <ProgressPhotosRow
                photos={photos}
                currentWeight={Number(weight) || null}
                onPhotosUpdated={fetchPhotos}
                onOpenGallery={(photoId) => {
                    setGalleryInitialPhotoId(photoId);
                    setGalleryOpen(true);
                }}
            />

            {/* Modals */}
            <ProgressPhotoGalleryModal
                isOpen={galleryOpen}
                initialPhotoId={galleryInitialPhotoId}
                photos={photos}
                onClose={() => setGalleryOpen(false)}
                onPhotosUpdated={fetchPhotos}
            />

            <WeightWeighInPromptModal
                isOpen={showWeighInPrompt}
                currentWeight={Number(weight) || null}
                onClose={() => setShowWeighInPrompt(false)}
                onPhotoUploaded={fetchPhotos}
            />
        </div>
    );
}
