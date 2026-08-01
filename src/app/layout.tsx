import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { DateProvider } from '@/contexts/DateContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import '@/styles/index.css';

export const metadata: Metadata = {
  title: 'Workout OS',
  description: 'Your personal health, fitness, and budget dashboard',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Workout OS',
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
        <ThemeProvider>
          <AuthProvider>
            <DateProvider>
              <ServiceWorkerRegister />
              {children}
            </DateProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
