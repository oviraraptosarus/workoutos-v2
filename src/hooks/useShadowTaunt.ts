'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ShadowSessionData {
  label: string;
  duration: number;
  volume: number;
  calories: number;
  intensity: string;
  date: string;
}

export interface ShadowWarRoomData {
  verdict: string;
  shadowSession: ShadowSessionData | null;
  userSession: ShadowSessionData | null;
  weekStats: {
    userCount: number;
    shadowCount: number;
  };
}

interface CachedWarRoom {
  data: ShadowWarRoomData;
  timestamp: number;
}

export function useShadowWarRoom(domain: string = 'general') {
  const { user, isProfileLoaded } = useAuth();
  const [data, setData] = useState<ShadowWarRoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !isProfileLoaded) return;

    // Key rotates every 30 minutes so verdict changes frequently
    const timeSlot = Math.floor(Date.now() / (30 * 60 * 1000));
    const cacheKey = `workout_os_shadow_warroom_v9_${domain}_${timeSlot}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed: CachedWarRoom = JSON.parse(cached);
        // Cache for 30 minutes (key already rotates, this is just a safety check)
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          setData(parsed.data);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/ai/shadow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            domain,
            // Send actual first name to API
            userName: (user as any)?.userProfile?.fullName?.split(' ')[0]
              || user?.user_metadata?.name?.split(' ')[0]
              || user?.user_metadata?.full_name?.split(' ')[0]
              || 'You',
            focusAngle: ['fitness', 'sleep', 'finance', 'tasks', 'discipline'][Math.floor(Math.random() * 5)]
          })
        });

        if (res.ok) {
          const json: ShadowWarRoomData = await res.json();
          setData(json);
          localStorage.setItem(cacheKey, JSON.stringify({
            data: json,
            timestamp: Date.now()
          }));
        }
      } catch (err) {
        console.error("Failed to fetch Shadow War Room data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, isProfileLoaded, domain]);

  return { data, isLoading };
}

// Keep the old hook as a shim for BudgetShadowTaunt/WorkoutShadowTaunt
export function useShadowTaunt(domain: string, _context?: any) {
  const { data, isLoading } = useShadowWarRoom(domain);
  return { taunt: data?.verdict || '', isLoading };
}
