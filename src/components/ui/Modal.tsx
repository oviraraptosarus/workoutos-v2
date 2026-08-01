'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/20 backdrop-blur-md animate-fade-in">
            <div 
                className="relative w-full max-w-lg glass-panel sm:rounded-3xl rounded-t-3xl rounded-b-none p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] overflow-hidden animate-sheet-up sm:animate-slide-up pb-8 sm:pb-6 border-white/60"
            >
                {/* Drag Handle for Mobile */}
                <div className="w-12 h-1.5 bg-gray-400/50 rounded-full mx-auto mb-6 sm:hidden shadow-sm" />
                
                <div className="flex items-center justify-between pb-4">
                    <h2 className="text-xl font-bold text-on-surface drop-shadow-sm">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-card-white/50 text-on-surface-variant hover:text-on-surface hover:bg-card-white/80 transition-colors btn-press border border-white/40 shadow-sm"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="pt-2 max-h-[85vh] overflow-y-auto overscroll-y-contain touch-pan-y scrollbar-hide">{children}</div>
            </div>
        </div>
    );
}
