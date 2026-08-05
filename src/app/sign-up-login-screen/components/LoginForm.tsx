'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Lock } from 'lucide-react';

interface LoginFormProps {
    onForgotPassword: () => void;
}

export default function LoginForm({ onForgotPassword }: LoginFormProps) {
    const { t } = useLanguage();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        const remembered = localStorage.getItem('workoutos_remembered_username');
        if (remembered) {
            setEmail(remembered);
        }
    }, []);

    const focusNext = (e: React.KeyboardEvent<HTMLInputElement>, nextId?: string) => {
        if (e.key === 'Enter' && nextId) {
            e.preventDefault();
            document.getElementById(nextId)?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signIn(email, password);
            if (!rememberMe) {
                localStorage.removeItem('workoutos_remembered_username');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputWrap = 'relative';
    const inputCls =
        'w-full bg-surface-container-low border border-surface-variant rounded-xl pl-11 pr-3 h-12 font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-shadow';

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
                type="button"
                onClick={async () => {
                    setLoading(true);
                    try {
                        const { supabase, getURL } = await import('@/lib/supabase/client');
                        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${getURL()}auth/callback` }});
                    } catch (err: any) {
                        setError(err.message);
                        setLoading(false);
                    }
                }}
                className="w-full bg-white text-black font-label-md text-label-md h-12 rounded-xl flex items-center justify-center gap-2 border border-black/10 shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
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

            {error && (
                <div className="p-3 font-label-sm text-label-sm bg-error-container text-on-error-container rounded-xl">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="login-email" className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
                    Email or Username
                </label>
                <div className={inputWrap}>
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    <input
                        id="login-email"
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => focusNext(e, 'login-password')}
                        enterKeyHint="next"
                        placeholder={t('auth.login.emailPlaceholder') !== 'auth.login.emailPlaceholder' ? t('auth.login.emailPlaceholder') : 'you@email.com or username'}
                        className={inputCls}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="login-password" className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
                    Password
                </label>
                <div className={inputWrap}>
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    <input
                        id="login-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        enterKeyHint="go"
                        placeholder="••••••••"
                        className={inputCls}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="remember-me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-surface-variant text-primary focus:ring-primary bg-surface-container-low cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="font-label-sm text-label-sm text-on-surface-variant cursor-pointer">
                        Remember Me
                    </label>
                </div>
                <button
                    type="button"
                    onClick={onForgotPassword}
                    className="font-label-sm text-label-sm text-secondary hover:underline"
                >
                    Forgot Password?
                </button>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-label-md text-label-md h-12 rounded-xl transition-transform active:scale-[0.98] disabled:opacity-50 mt-1"
            >
                {loading ? (t('auth.login.signingIn') !== 'auth.login.signingIn' ? t('auth.login.signingIn') : 'Signing in...') : (t('auth.login.signInButton') !== 'auth.login.signInButton' ? t('auth.login.signInButton') : 'Sign In')}
            </button>
        </form>
    );
}
