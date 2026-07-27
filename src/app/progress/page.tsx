'use client';

import Link from 'next/link';

export default function ProgressPage() {
  return (
    <div className="min-h-screen bg-[#f7f6f0] flex flex-col items-center justify-center gap-4 font-sans">
      <h1 className="text-2xl font-black text-stone-900">Progress Log</h1>
      <p className="text-stone-500 text-sm">Coming soon — track your visual progress here.</p>
      <Link href="/dashboard" className="mt-4 bg-stone-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-stone-700 transition-colors">
        Back to Dashboard
      </Link>
    </div>
  );
}
