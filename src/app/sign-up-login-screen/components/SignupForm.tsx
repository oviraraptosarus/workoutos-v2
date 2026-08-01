'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AtSign, Mail, Lock, ShieldCheck, User } from 'lucide-react';

export default function SignupForm() {
    const { signUp } = useAuth();
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    
    const [error, setError] = useState('');
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
            setError('You must accept the Terms and Conditions.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { supabase } = await import('@/lib/supabaseClient');
            const { data: isAvailable, error: checkError } = await supabase.rpc('check_username_available', { p_username: username.toLowerCase() });

            if (checkError) throw checkError;
            if (!isAvailable) {
                throw new Error('This username is already taken. Please choose another.');
            }

            await signUp(email, password, {
                fullName: fullName.trim(),
                username: username.toLowerCase()
            });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };

    const inputCls =
        'w-full bg-surface-container-low border border-surface-variant rounded-2xl pl-11 pr-3 py-3 font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-shadow';

    return (
        <form onSubmit={handleSubmit} className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                <label htmlFor="signup-fullname" className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Full Name</label>
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
                <label htmlFor="signup-email" className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Email Address</label>
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
                    I agree to the <span className="text-secondary hover:underline">Terms of Service</span> and <span className="text-secondary hover:underline">Privacy Policy</span>.
                </label>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-label-md text-label-md py-3.5 rounded-2xl transition-transform active:scale-[0.98] disabled:opacity-50 mt-3"
            >
                {loading ? 'Creating account…' : 'Create Account'}
            </button>
        </form>
    );
}
