'use client';

import React, { useState } from 'react';
import UserProfileModal from '@/app/components/UserProfileModal';
import { useAuth } from '@/contexts/AuthContext';

export function TopNav() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { userProfile } = useAuth();
  const displayName = userProfile?.fullName ? userProfile.fullName.split(' ')[0] : (userProfile?.username || 'User');
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="fixed top-0 w-full z-50 glass pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-mobile max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[20px]">vital_signs</span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface tracking-tight">Workout OS</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </button>
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity btn-press"
            >
              {userProfile ? (
                <span className="text-on-primary text-xs font-bold">{initial}</span>
              ) : (
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              )}
            </button>
          </div>
        </div>
      </header>
      
      {isProfileOpen && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          initialTab="profile"
        />
      )}
    </>
  );
}
