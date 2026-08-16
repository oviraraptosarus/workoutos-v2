'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// This page is the entry point. It waits for the client-side auth state
// (which reads from localStorage) to resolve, then redirects accordingly.
// A server-side check was previously used here, but it could never see the
// session because auth is stored in localStorage (not cookies), causing the
// welcome slideshow to always flash for logged-in users.
export default function Home() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (session) {
      router.replace('/dashboard');
    } else {
      router.replace('/welcome');
    }
  }, [session, isLoading, router]);

  // Render nothing while auth resolves — blank screen, no flash.
  return null;
}
