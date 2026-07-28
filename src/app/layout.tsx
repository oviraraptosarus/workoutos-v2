import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { DateProvider } from '@/contexts/DateContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { Inter } from 'next/font/google';
import '@/styles/index.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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
    <html lang="en" className={inter.variable}>
      <body className={`min-h-screen bg-[#faf9f6] dark:bg-[#0f1115] text-stone-900 dark:text-gray-100 antialiased selection:bg-emerald-100 dark:selection:bg-emerald-900/50 font-sans relative overflow-x-hidden transition-colors duration-300`}>
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
