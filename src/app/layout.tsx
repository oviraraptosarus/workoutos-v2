import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { DateProvider } from '@/contexts/DateContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import LevelUpOverlay from '@/components/LevelUpOverlay';
import '@/styles/tailwind.css';
import '@/styles/index.css';

export const metadata: Metadata = {
  title: 'Workout OS',
  description: 'Your personal health, fitness, and budget dashboard',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Workout OS',
    startupImage: '/icon-512.png',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0f1115',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="bg-background font-body-md text-on-background min-h-screen relative overflow-x-hidden selection:bg-activity-green/20 overscroll-none">
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <DateProvider>
                <ServiceWorkerRegister />
                <LevelUpOverlay />
                {children}
              </DateProvider>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
