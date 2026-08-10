'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ScanLine, Camera, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
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
    const [servingWeight, setServingWeight] = useState<number>(100);
    const [baseWeight, setBaseWeight] = useState<number>(100);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const resetScanner = () => {
        setImagePreview(null);
        setIsScanning(false);
        setParsedMeal(null);
        setError(null);
        setServingWeight(100);
        setBaseWeight(100);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (galleryInputRef.current) galleryInputRef.current.value = '';
    };

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            resetScanner();
        }
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setParsedMeal(null);

        try {
            const { compressImage } = await import('@/utils/imageCompression');
            const compressedDataUrl = await compressImage(file, 800, 800, 0.7);
            setImagePreview(compressedDataUrl);
            await scanImage(compressedDataUrl, file.type);
        } catch (err) {
            console.error('Failed to compress image:', err);
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
                await scanImage(base64String, file.type);
            };
            reader.readAsDataURL(file);
        }
    };

    const scanImage = async (base64: string, mimeType: string) => {
        setIsScanning(true);
        try {
            const res = await fetch('/api/ai/vision', {
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
                
                let base = 100;
                if (meal.portion) {
                    const match = meal.portion.match(/([\d.]+)\s*(g|ml)/i);
                    if (match) {
                        base = parseFloat(match[1]) || 100;
                    }
                }
                setBaseWeight(base);
                setServingWeight(base);

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

    const multiplier = baseWeight > 0 ? (servingWeight / baseWeight) : 1;
    const displayCalories = Math.round((parsedMeal?.calories || 0) * multiplier);
    const displayProtein = Math.round((parsedMeal?.protein || 0) * multiplier);
    const displayCarbs = Math.round((parsedMeal?.carbs || 0) * multiplier);
    const displayFat = Math.round((parsedMeal?.fat || 0) * multiplier);

    const handleLogMeal = () => {
        if (parsedMeal) {
            onLogMeal({
                ...parsedMeal,
                calories: displayCalories,
                protein: displayProtein,
                carbs: displayCarbs,
                fat: displayFat,
                portion: servingWeight === baseWeight ? parsedMeal.portion : `${servingWeight}g`,
                bites: Math.max(1, Math.round(displayCalories / 50))
            });
            onClose();
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card-white  border border-surface-variant  rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-surface-variant  bg-surface-container-low/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-white dark:text-white flex items-center justify-center">
                            <ScanLine size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-on-surface dark:text-white uppercase tracking-wider">Nutrition Scanner</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-surface-container-high dark:hover:bg-surface-container-high transition-colors text-on-surface-variant btn-press"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5 flex flex-col items-center">
                    
                    {!imagePreview && (
                        <div className="text-center w-full">
                            <div className="w-24 h-24 bg-white/5 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/10 dark:border-emerald-800 border-dashed">
                                <ScanLine size={32} className="text-white" />
                            </div>
                            <h3 className="font-bold text-on-surface dark:text-white text-lg mb-2">Scan Label or Barcode</h3>
                            <p className="text-sm text-on-surface-variant dark:text-on-surface-variant mb-6">
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
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={galleryInputRef}
                                onChange={handleFileChange}
                            />
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 py-4 bg-gray-900 dark:bg-card-white text-white dark:text-on-surface font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg btn-press"
                                >
                                    <Camera size={18} /> Camera
                                </button>
                                <button 
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="flex-1 py-4 bg-gray-900 dark:bg-card-white text-white dark:text-on-surface font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg btn-press"
                                >
                                    <ImageIcon size={18} /> Gallery
                                </button>
                            </div>
                        </div>
                    )}

                    {imagePreview && (
                        <div className="w-full space-y-4">
                            {/* Image Preview Container */}
                            <div className="relative w-full h-48 bg-surface-container dark:bg-surface-container-high rounded-2xl overflow-hidden border border-surface-variant ">
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
                                <div className="p-3 bg-white/5 dark:bg-rose-900/30 text-white dark:text-white text-xs font-bold rounded-xl flex items-start gap-2 border border-white/10 dark:border-rose-800/50">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {parsedMeal && !isScanning && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-white/5/50 dark:bg-emerald-900/10 border border-white/10 dark:border-emerald-800/50 rounded-2xl p-4">
                                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10 dark:border-emerald-800/30">
                                            <div className="text-2xl">{parsedMeal.icon}</div>
                                            <div>
                                                <h4 className="font-bold text-on-surface dark:text-white leading-tight">{parsedMeal.name}</h4>
                                                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{parsedMeal.category} • {parsedMeal.portion}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            <div className="bg-card-white  rounded-xl p-2 border border-surface-variant  shadow-sm">
                                                <div className="text-[10px] text-on-surface-variant font-bold mb-0.5">KCAL</div>
                                                <div className="text-sm font-bold text-white">{displayCalories}</div>
                                            </div>
                                            <div className="bg-card-white  rounded-xl p-2 border border-surface-variant  shadow-sm">
                                                <div className="text-[10px] text-on-surface-variant font-bold mb-0.5">PRO</div>
                                                <div className="text-sm font-bold text-on-surface-variant dark:text-gray-200">{displayProtein}g</div>
                                            </div>
                                            <div className="bg-card-white  rounded-xl p-2 border border-surface-variant  shadow-sm">
                                                <div className="text-[10px] text-on-surface-variant font-bold mb-0.5">CARB</div>
                                                <div className="text-sm font-bold text-on-surface-variant dark:text-gray-200">{displayCarbs}g</div>
                                            </div>
                                            <div className="bg-card-white  rounded-xl p-2 border border-surface-variant  shadow-sm">
                                                <div className="text-[10px] text-on-surface-variant font-bold mb-0.5">FAT</div>
                                                <div className="text-sm font-bold text-on-surface-variant dark:text-gray-200">{displayFat}g</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-card-white border border-surface-variant rounded-2xl p-3 shadow-sm flex items-center justify-between">
                                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Weight (g / ml)</p>
                                        <input 
                                            type="number" 
                                            value={servingWeight || ''} 
                                            onChange={(e) => setServingWeight(Number(e.target.value) || 0)}
                                            className="w-20 bg-surface-container rounded-lg p-1.5 text-center text-sm font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div className="bg-card-white  border border-surface-variant  rounded-2xl p-3 shadow-sm">
                                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 text-center">Categorize Meal As</p>
                                        <div className="flex bg-surface-container-low dark:bg-surface-container-high p-1 rounded-xl">
                                            {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setParsedMeal({...parsedMeal, category: cat as any})}
                                                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${parsedMeal.category === cat ? 'bg-card-white dark:bg-slate-700 text-on-surface dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-slate-600' : 'text-on-surface-variant hover:text-on-surface-variant dark:hover:text-on-surface-variant'}`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={resetScanner}
                                            className="flex-1 py-3 bg-surface-container dark:bg-surface-container-high hover:bg-surface-container-high dark:hover:bg-slate-700 text-on-surface-variant dark:text-on-surface-variant text-xs font-bold rounded-xl transition-colors"
                                        >
                                            Retake
                                        </button>
                                        <button 
                                            onClick={handleLogMeal}
                                            className="flex-[2] py-3 bg-white hover:bg-white text-black text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <CheckCircle2 size={16} /> Log Meal
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(!parsedMeal && !isScanning && error) && (
                                <button 
                                    onClick={resetScanner}
                                    className="w-full py-3 bg-surface-container dark:bg-surface-container-high hover:bg-surface-container-high dark:hover:bg-slate-700 text-on-surface-variant dark:text-on-surface-variant text-xs font-bold rounded-xl transition-colors"
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
