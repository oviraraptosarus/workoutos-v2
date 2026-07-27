'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Camera, Image, CheckCircle, ChevronRight, X, Trash2, LayoutGrid, Maximize2 } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

interface ProgressPhoto {
    id: string;
    url: string;
    date: string;
    weight: number;
    notes?: string;
}

const MOCK_PHOTOS: ProgressPhoto[] = [
    {
        id: '1',
        url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80',
        date: '2026-06-01',
        weight: 85,
        notes: 'Day 1 of the cut'
    },
    {
        id: '2',
        url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
        date: '2026-06-15',
        weight: 83.5,
        notes: 'Feeling tighter'
    },
    {
        id: '3',
        url: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&auto=format&fit=crop&q=80',
        date: '2026-07-01',
        weight: 81.2,
        notes: 'Abs starting to show'
    }
];

export default function ProgressPhotosPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [photos, setPhotos] = useState<ProgressPhoto[]>(MOCK_PHOTOS);
    const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    
    // For comparing two photos
    const [compareLeft, setCompareLeft] = useState<ProgressPhoto | null>(photos[0] || null);
    const [compareRight, setCompareRight] = useState<ProgressPhoto | null>(photos[photos.length - 1] || null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newPhoto: ProgressPhoto = {
                    id: Date.now().toString(),
                    url: reader.result as string,
                    date: new Date().toISOString().split('T')[0],
                    weight: userProfile?.currentWeight || 0,
                    notes: 'New progress log'
                };
                setPhotos([newPhoto, ...photos]);
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const deletePhoto = (id: string) => {
        setPhotos(photos.filter(p => p.id !== id));
        setSelectedPhoto(null);
    };

    return (
        <div className="min-h-screen bg-[#f7f6f0] text-stone-900 pb-32 font-sans selection:bg-emerald-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[#f7f6f0]/80 backdrop-blur-xl border-b border-stone-200/50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-stone-200/50 text-stone-600 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-lg font-black tracking-tight text-stone-900">Progress Log</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsComparing(!isComparing)}
                            className={`p-2 rounded-xl border transition-all ${isComparing ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-stone-200 text-stone-600 shadow-sm'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={handleUploadClick}
                            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors btn-press shadow-sm"
                        >
                            <Camera size={16} /> <span className="hidden sm:inline">Add Photo</span>
                        </button>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
                
                {isComparing ? (
                    <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-black text-stone-900">Compare Progress</h2>
                            <button onClick={() => setIsComparing(false)} className="text-xs font-bold text-stone-400 hover:text-stone-600">Close</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Left Compare */}
                            <div className="space-y-2">
                                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 relative group border border-stone-100">
                                    {compareLeft ? (
                                        <img src={compareLeft.url} alt="Before" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                                            <Image size={24} className="mb-2" />
                                            <span className="text-xs font-bold">Select Before</span>
                                        </div>
                                    )}
                                </div>
                                <select 
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700"
                                    value={compareLeft?.id || ''}
                                    onChange={(e) => setCompareLeft(photos.find(p => p.id === e.target.value) || null)}
                                >
                                    <option value="">Select Photo</option>
                                    {photos.map(p => (
                                        <option key={p.id} value={p.id}>{p.date} ({p.weight}kg)</option>
                                    ))}
                                </select>
                            </div>

                            {/* Right Compare */}
                            <div className="space-y-2">
                                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 relative group border border-stone-100">
                                    {compareRight ? (
                                        <img src={compareRight.url} alt="After" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                                            <Image size={24} className="mb-2" />
                                            <span className="text-xs font-bold">Select After</span>
                                        </div>
                                    )}
                                </div>
                                <select 
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700"
                                    value={compareRight?.id || ''}
                                    onChange={(e) => setCompareRight(photos.find(p => p.id === e.target.value) || null)}
                                >
                                    <option value="">Select Photo</option>
                                    {photos.map(p => (
                                        <option key={p.id} value={p.id}>{p.date} ({p.weight}kg)</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {compareLeft && compareRight && (
                            <div className="mt-6 flex items-center justify-center gap-4 text-sm font-bold bg-stone-50 p-4 rounded-2xl border border-stone-100">
                                <div className="text-center">
                                    <span className="block text-[10px] text-stone-500 uppercase tracking-wider">Weight Diff</span>
                                    <span className={`text-lg ${compareRight.weight < compareLeft.weight ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {(compareRight.weight - compareLeft.weight).toFixed(1)} kg
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-stone-200" />
                                <div className="text-center">
                                    <span className="block text-[10px] text-stone-500 uppercase tracking-wider">Time</span>
                                    <span className="text-lg text-indigo-600">
                                        {Math.abs(Math.round((new Date(compareRight.date).getTime() - new Date(compareLeft.date).getTime()) / (1000 * 3600 * 24)))} Days
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="columns-2 sm:columns-3 gap-4 space-y-4">
                        {photos.map((photo) => (
                            <div 
                                key={photo.id} 
                                onClick={() => setSelectedPhoto(photo)}
                                className="break-inside-avoid relative rounded-3xl overflow-hidden group cursor-pointer shadow-sm border border-stone-200 hover:shadow-md transition-all animate-in fade-in zoom-in-95 duration-500"
                            >
                                <img src={photo.url} alt={`Progress on ${photo.date}`} className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" />
                                
                                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-0 sm:translate-y-4 sm:group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-white font-black text-sm drop-shadow-md">{photo.weight} kg</span>
                                            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mt-0.5">{new Date(photo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                            <Maximize2 size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {photos.length === 0 && (
                    <div className="text-center py-20 bg-white border border-stone-200 border-dashed rounded-3xl">
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                            <Camera size={32} />
                        </div>
                        <h3 className="text-sm font-black text-stone-900">No Photos Yet</h3>
                        <p className="text-xs text-stone-500 font-medium mt-1 mb-4">Start tracking your visual progress</p>
                        <button 
                            onClick={handleUploadClick}
                            className="bg-indigo-50 text-indigo-600 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors hover:bg-indigo-100"
                        >
                            Upload First Photo
                        </button>
                    </div>
                )}
            </main>

            <BottomNav />

            {/* Lightbox Modal */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
                    <button 
                        onClick={() => setSelectedPhoto(null)}
                        className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="w-full max-w-4xl p-4 flex flex-col sm:flex-row items-center gap-8">
                        <img 
                            src={selectedPhoto.url} 
                            alt={`Progress on ${selectedPhoto.date}`} 
                            className="max-h-[70vh] sm:max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl" 
                        />
                        
                        <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-6 text-white w-full sm:w-80 flex-shrink-0">
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold block mb-1">Date Logged</span>
                                    <span className="text-lg font-black">{new Date(selectedPhoto.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold block mb-1">Weight</span>
                                    <span className="text-lg font-black">{selectedPhoto.weight} kg</span>
                                </div>
                                {selectedPhoto.notes && (
                                    <div>
                                        <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold block mb-1">Notes</span>
                                        <p className="text-sm font-medium text-white/90 leading-relaxed">{selectedPhoto.notes}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-white/10 flex gap-3">
                                <button 
                                    onClick={() => {
                                        deletePhoto(selectedPhoto.id);
                                    }}
                                    className="flex-1 bg-white/10 hover:bg-rose-500/80 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
