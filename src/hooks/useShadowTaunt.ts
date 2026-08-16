'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ShadowTaunt {
  taunt: string;
  timestamp: number;
}

export function useShadowTaunt(domain: string, context?: any) {
  const { user, isProfileLoaded } = useAuth();
  const [taunt, setTaunt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !isProfileLoaded) return;

    const cacheKey = `workout_os_shadow_taunt_${domain}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsed: ShadowTaunt = JSON.parse(cached);
        // Cache for 12 hours to save API costs
        if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) {
          setTaunt(parsed.taunt);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        // invalid cache
      }
    }

    const fetchTaunt = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/ai/shadow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            domain,
            context
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.taunt) {
            setTaunt(data.taunt);
            localStorage.setItem(cacheKey, JSON.stringify({
              taunt: data.taunt,
              timestamp: Date.now()
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch Shadow taunt", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaunt();
  }, [user, isProfileLoaded, domain, JSON.stringify(context)]);

  return { taunt, isLoading };
}
