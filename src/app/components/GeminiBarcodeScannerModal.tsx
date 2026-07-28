'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ScanLine, Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { MealItem } from '../diet/types';

interface GeminiBarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogMeal: (meal: Omit<MealItem, 'id'>) => void;
}

export default function GeminiBarcodeScannerModal({ isOpen, onClose, onLogMeal }: GeminiBarcodeScannerModalProps) {
    const [mounted, setMounted] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [parsedMeal, setParsedMeal] = useState<Omit<MealItem, 'id'> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setImagePreview(null);
            setIsScanning(false);
            setParsedMeal(null);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setParsedMeal(null);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setImagePreview(base64String);
            await scanImage(base64String, file.type);
        };
        reader.readAsDataURL(file);
    };

    const scanImage = async (base64: string, mimeType: string) => {
        setIsScanning(true);
        try {
            const res = await fetch('/api/gemini/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: base64,
                    mimeType: mimeType
                })
            });

            const data = await res.json();
            
            if (res.ok && data.meal) {
                const meal = data.meal;
                // Auto calculate bites if not provided
                if (!meal.bites) {
                    meal.bites = Math.max(1, Math.round(meal.calories / 50));
                }
                setParsedMeal(meal);
            } else {
                throw new Error(data.error || 'Failed to scan image');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong while scanning.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleLogMeal = () => {
        if (parsedMeal) {
            onLogMeal(parsedMeal);
            onClose();
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <ScanLine size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Nutrition Scanner</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors text-gray-400 btn-press"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col items-center">
                    
                    {!imagePreview && (
                        <div className="text-center w-full">
                            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-100 dark:border-emerald-800 border-dashed">
                                <ScanLine size={32} className="text-emerald-500" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Scan Label or Barcode</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Snap a picture of a nutrition label or product barcode. Gemini will auto-extract all macros.
                            </p>
                            
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg btn-press"
                            >
                                <Camera size={18} /> Take Photo / Upload
                            </button>
                        </div>
                    )}

                    {imagePreview && (
                        <div className="w-full space-y-4">
                            {/* Image Preview Container */}
                            <div className="relative w-full h-48 bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
                                <img src={imagePreview} alt="Scanned" className="w-full h-full object-contain" />
                                
                                {isScanning && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                        <Loader2 size={32} className="animate-spin mb-2" />
                                        <span className="text-xs font-bold animate-pulse">Gemini analyzing image...</span>
                                        {/* Fake scanning line animation */}
                                        <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] animate-scan" />
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl flex items-start gap-2 border border-rose-100 dark:border-rose-800/50">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {parsedMeal && !isScanning && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-4">
                                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-emerald-100 dark:border-emerald-800/30">
                                            <div className="text-2xl">{parsedMeal.icon}</div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{parsedMeal.name}</h4>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{parsedMeal.category} • {parsedMeal.portion}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            <div className="bg-white dark:bg-slate-900 rounded-xl p-2 border border-gray-100 dark:border-slate-800 shadow-sm">
                                                <div className="text-[10px] text-gray-400 font-bold mb-0.5">KCAL</div>
                                                <div className="text-sm font-black text-emerald-600">{parsedMeal.calories}</div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 rounded-xl p-2 border border-gray-100 dark:border-slate-800 shadow-sm">
                                                <div className="text-[10px] text-gray-400 font-bold mb-0.5">PRO</div>
                                                <div className="text-sm font-black text-gray-700 dark:text-gray-200">{parsedMeal.protein}g</div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 rounded-xl p-2 border border-gray-100 dark:border-slate-800 shadow-sm">
                                                <div className="text-[10px] text-gray-400 font-bold mb-0.5">CARB</div>
                                                <div className="text-sm font-black text-gray-700 dark:text-gray-200">{parsedMeal.carbs}g</div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 rounded-xl p-2 border border-gray-100 dark:border-slate-800 shadow-sm">
                                                <div className="text-[10px] text-gray-400 font-bold mb-0.5">FAT</div>
                                                <div className="text-sm font-black text-gray-700 dark:text-gray-200">{parsedMeal.fat}g</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">Categorize Meal As</p>
                                        <div className="flex bg-gray-50 dark:bg-slate-800 p-1 rounded-xl">
                                            {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setParsedMeal({...parsedMeal, category: cat as any})}
                                                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${parsedMeal.category === cat ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-slate-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-colors"
                                        >
                                            Retake
                                        </button>
                                        <button 
                                            onClick={handleLogMeal}
                                            className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <CheckCircle2 size={16} /> Log Meal
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(!parsedMeal && !isScanning && error) && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-colors"
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    )}

                </div>
            </div>
            
            {/* Inject scanner animation styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes scan {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }
                .animate-scan {
                    animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
            `}} />
        </div>
    );

    return createPortal(modalContent, document.body);
}
