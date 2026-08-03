'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AtSign, Mail, Lock, ShieldCheck, User, Check } from 'lucide-react';

interface SignupFormProps {
    onSuccess?: () => void;
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
    const router = useRouter();
    const { t } = useLanguage();
    const { signUp } = useAuth();
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    
    const [error, setError] = useState('');
    const [successMode, setSuccessMode] = useState<'none' | 'email' | 'created'>('none');
    const [loading, setLoading] = useState(false);

    const focusNext = (e: React.KeyboardEvent<HTMLInputElement>, nextId?: string) => {
        if (e.key === 'Enter' && nextId) {
            e.preventDefault();
            document.getElementById(nextId)?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
            setError('Please fill out all fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (!acceptTerms) {
            setError(t('auth.acceptTermsError') !== 'auth.acceptTermsError' ? t('auth.acceptTermsError') : 'You must accept the Terms and Conditions.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMode('none');

        try {
            const { supabase } = await import('@/lib/supabase/client');
            const { data: isAvailable, error: checkError } = await supabase.rpc('check_username_available', { p_username: username.toLowerCase() });

            if (checkError) throw checkError;
            if (!isAvailable) {
                throw new Error('This username is already taken. Please choose another.');
            }

            const response = await signUp(email, password, { 
                fullName, 
                username: username.toLowerCase(),
                accepted_terms: true,
                accepted_privacy: true,
                terms_version: 'v1.0',
                privacy_version: 'v1.0',
                accepted_at: new Date().toISOString()
            });

            if (response?.session) {
                // If auto-logged in, sign them out to force manual login
                const { supabase } = await import('@/lib/supabase/client');
                await supabase.auth.signOut();
                setSuccessMode('created');
            } else {
                setSuccessMode('email');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputCls =
        'w-full bg-surface-container-low border border-surface-variant rounded-2xl pl-11 pr-3 py-3 font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-shadow';

    if (successMode !== 'none') {
        if (successMode === 'created') {
            return (
                <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-activity-green/10 text-activity-green rounded-full flex items-center justify-center mb-6">
                        <Check size={32} />
                    </div>
                    <h2 className="font-display-sm text-2xl font-bold text-on-surface mb-2">Account Created!</h2>
                    <p className="font-body-md text-on-surface-variant mb-8 max-w-sm">
                        Your account has been successfully created. Please log in to complete your profile setup.
                    </p>
                    <button
                        onClick={onSuccess}
                        className="w-full bg-primary text-on-primary font-label-md text-label-md py-3.5 rounded-2xl transition-transform active:scale-[0.98]"
                    >
                        Go to Login
                    </button>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-activity-green/10 text-activity-green rounded-full flex items-center justify-center mb-6">
                    <Mail size={32} />
                </div>
                <h2 className="font-display-sm text-2xl font-bold text-on-surface mb-2">Check your email</h2>
                <p className="font-body-md text-on-surface-variant mb-8 max-w-sm">
                    We sent a confirmation link to <span className="font-semibold text-on-surface">{email}</span>. Please click the link to activate your account.
                </p>
                <p className="text-sm text-on-surface-variant/70 italic">
                    (If you are the developer testing locally, check your Inbucket or disable Email Confirmations in Supabase settings).
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
                type="button"
                onClick={async () => {
                    setLoading(true);
                    try {
                        const { supabase } = await import('@/lib/supabase/client');
                        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` }});
                    } catch (err: any) {
                        setError(err.message);
                        setLoading(false);
                    }
                }}
                className="w-full bg-white text-black font-label-md text-label-md py-3.5 rounded-2xl flex items-center justify-center gap-2 border border-black/10 shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
            </button>
            <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-surface-variant"></div>
                <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider">or with email</span>
                <div className="flex-1 h-px bg-surface-variant"></div>
            </div>

            <div className="p-3 font-label-sm text-label-sm bg-secondary/10 rounded-xl text-secondary flex items-center gap-2">
                <ShieldCheck size={15} className="shrink-0" />
                <span>Your profile stays private and synced to your account.</span>
            </div>

            {error && (
                <div className="p-3 font-label-sm text-label-sm bg-error-container text-on-error-container rounded-xl">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="signup-fullname" className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">{t('auth.signup.name') !== 'auth.signup.name' ? t('auth.signup.name') : 'Full Name'}</label>
                <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    <input
                        id="signup-fullname"
                        type="text"
                        required
                        placeholder="Alex Johnson"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onKeyDown={(e) => focusNext(e, 'signup-username')}
                        enterKeyHint="next"
                        className={inputCls}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="signup-username" className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Username</label>
                <div className="relative">
                    <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    <input
                        id="signup-username"
                        type="text"
                        required
                        placeholder="workout_warrior"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => focusNext(e, 'signup-email')}
                        enterKeyHint="next"
                        className={inputCls}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="signup-email" className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">{t('auth.signup.email') !== 'auth.signup.email' ? t('auth.signup.email') : 'Email Address'}</label>
                <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    <input
                        id="signup-email"
                        type="email"
                        required
                        placeholder="alex@workoutos.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => focusNext(e, 'signup-password')}
                        enterKeyHint="next"
                        className={inputCls}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="signup-password" className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Password</label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                        <input
                            id="signup-password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => focusNext(e, 'signup-confirm')}
                            enterKeyHint="next"
                            className={inputCls}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="signup-confirm" className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Confirm</label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                        <input
                            id="signup-confirm"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            enterKeyHint="go"
                            className={inputCls}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
                <input
                    type="checkbox"
                    id="accept-terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="w-5 h-5 rounded-md border-surface-variant text-primary focus:ring-primary bg-surface-container-low cursor-pointer"
                />
                <label htmlFor="accept-terms" className="font-label-sm text-label-sm text-on-surface-variant cursor-pointer">
                    {t('auth.agreeTerms') !== 'auth.agreeTerms' ? t('auth.agreeTerms') : 'I agree to the'} <Link href="/terms" target="_blank" className="text-secondary hover:underline">{t('profile.terms') !== 'profile.terms' ? t('profile.terms') : 'Terms of Service'}</Link> {t('auth.and') !== 'auth.and' ? t('auth.and') : 'and'} <Link href="/privacy" target="_blank" className="text-secondary hover:underline">{t('profile.privacy') !== 'profile.privacy' ? t('profile.privacy') : 'Privacy Policy'}</Link>.
                </label>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-label-md text-label-md py-3.5 rounded-2xl transition-transform active:scale-[0.98] disabled:opacity-50 mt-3"
            >
                {loading ? (t('auth.signup.creating') !== 'auth.signup.creating' ? t('auth.signup.creating') : 'Creating account...') : (t('auth.signup.createAccountButton') !== 'auth.signup.createAccountButton' ? t('auth.signup.createAccountButton') : 'Create Account')}
            </button>
        </form>
    );
}
