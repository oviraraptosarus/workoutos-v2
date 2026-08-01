'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';

export default function SignupForm() {
    const { signUp } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const focusNext = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, nextId?: string) => {
        if (e.key === 'Enter' && nextId) {
            e.preventDefault();
            document.getElementById(nextId)?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            // Check username availability
            const { supabase } = await import('@/lib/supabaseClient');
            const { data: isAvailable, error: checkError } = await supabase.rpc('check_username_available', { p_username: username.toLowerCase() });
            
            if (checkError) throw checkError;
            
            if (!isAvailable) {
                throw new Error('This username is already taken. Please choose another.');
            }

            await signUp(email, password, {
                // Initial metadata is empty, collected in Onboarding
                fullName: email.split('@')[0],
                username: username.toLowerCase()
            });
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to sign up');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 text-xs bg-blue-50 border border-blue-100 rounded-xl text-blue-600 flex items-center gap-1.5 font-semibold">
                <Sparkles size={14} className="shrink-0" />
                <span>Your profile info will be securely cached locally.</span>
            </div>

            {error && <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-semibold">{error}</div>}
            


            <div>
                <label htmlFor="signup-username" className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                <input
                    id="signup-username"
                    type="text"
                    required
                    placeholder="workout_warrior"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => focusNext(e, 'signup-email')}
                    enterKeyHint="next"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="signup-email" className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="alex@workoutos.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => focusNext(e, 'signup-password')}
                    enterKeyHint="next"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="signup-password" className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <input
                    id="signup-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    enterKeyHint="go"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-sm mt-1"
            >
                {loading ? 'Creating Account...' : 'Create Account'}
            </button>
        </form>
    );
}
