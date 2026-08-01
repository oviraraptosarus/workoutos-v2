'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock } from 'lucide-react';

interface LoginFormProps {
    onForgotPassword: () => void;
}

export default function LoginForm({ onForgotPassword }: LoginFormProps) {
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
            setError(err instanceof Error ? err.message : 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const inputWrap = 'relative';
    const inputCls =
        'w-full bg-surface-container-low border border-surface-variant rounded-2xl pl-11 pr-3 py-3 font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-shadow';

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                        placeholder="you@email.com or username"
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
                className="w-full bg-primary text-on-primary font-label-md text-label-md py-3.5 rounded-2xl transition-transform active:scale-[0.98] disabled:opacity-50 mt-1"
            >
                {loading ? 'Signing in…' : 'Sign In'}
            </button>
        </form>
    );
}
