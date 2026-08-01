'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AuthScreen from './components/AuthScreen';

export default function SignUpLoginScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant">
        <div className="flex flex-col items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-on-primary">vital_signs</span>
          </div>
          <span className="font-label-md text-label-md">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthScreen />
    </div>
  );
}
