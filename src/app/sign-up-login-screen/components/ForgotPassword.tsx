'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordProps {
    onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
    const { t } = useLanguage();
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            await resetPassword(email);
            setStatus('success');
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to send reset email');
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center text-center py-8 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-full bg-activity-green/10 text-activity-green flex items-center justify-center mb-6">
                    <CheckCircle2 size={32} />
                </div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Check your email</h2>
                <p className="font-body-md text-on-surface-variant mb-8 max-w-[16rem]">
                    We've sent password reset instructions to <strong>{email}</strong>.
                </p>
                <button
                    onClick={onBack}
                    className="w-full bg-surface-container text-on-surface font-label-md text-label-md py-3.5 rounded-2xl transition-transform active:scale-[0.98]"
                >
                    Back to Sign In
                </button>
            </div>
        );
    }

    const inputCls =
        'w-full bg-surface-container-low border border-surface-variant rounded-2xl pl-11 pr-3 py-3 font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-shadow';

    return (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <button
                onClick={onBack}
                aria-label="Back"
                className="w-10 h-10 -ml-2 mb-4 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors active:scale-90"
            >
                <ArrowLeft size={22} />
            </button>

            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Reset Password</h2>
            <p className="font-body-md text-on-surface-variant mb-6">
                Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {status === 'error' && (
                    <div className="p-3 font-label-sm text-label-sm bg-error-container text-on-error-container rounded-xl">
                        {errorMsg}
                    </div>
                )}

                <div>
                    <label htmlFor="reset-email" className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                        <input
                            id="reset-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@email.com"
                            className={inputCls}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={status === 'loading' || !email}
                    className="w-full bg-primary text-on-primary font-label-md text-label-md py-3.5 rounded-2xl transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                    {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>
        </div>
    );
}
