'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AuthScreen from './components/AuthScreen';

export default function SignUpLoginScreen() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F2F7] p-4">
      <AuthScreen />
    </div>
  );
}
