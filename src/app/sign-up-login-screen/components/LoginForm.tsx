'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { KeyRound, Mail, Sparkles } from 'lucide-react';

export default function LoginForm() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

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
        try {
            await signIn(email, password);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to sign in');
            }
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-xl">{error}</div>}

            <div>
                <label htmlFor="login-email" className="block text-xs font-medium text-gray-700 mb-1">Email or Username</label>
                <input
                    id="login-email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => focusNext(e, 'login-password')}
                    enterKeyHint="next"
                    placeholder="you@email.com or username"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
            </div>
            <div>
                <label htmlFor="login-password" className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    enterKeyHint="go"
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
            </div>
            <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-sm"
            >
                Sign In
            </button>
            <button
                type="button"
                onClick={() => {
                    setEmail('demo@workoutos.com');
                    setPassword('demo1234');
                    signIn('demo@workoutos.com', 'demo1234').catch(err => setError(err.message || 'Demo login failed'));
                }}
                className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
            >
                <Sparkles size={16} className="text-blue-500" />
                Quick Login (Demo)
            </button>
        </form>
    );
}
