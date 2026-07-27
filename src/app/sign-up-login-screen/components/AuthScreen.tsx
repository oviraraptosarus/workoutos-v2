'use client';

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Workout OS</h1>
                <p className="text-gray-500 text-xs mt-1">
                    {isLogin ? 'Sign in to access your dashboard' : 'Create an account to get started'}
                </p>
            </div>

            {isLogin ? <LoginForm /> : <SignupForm />}

            <div className="text-center mt-6 text-xs text-gray-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-500 hover:underline font-semibold"
                >
                    {isLogin ? 'Sign Up' : 'Log In'}
                </button>
            </div>
        </div>
    );
}
