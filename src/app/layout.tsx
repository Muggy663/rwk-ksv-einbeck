// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: 'RWK Einbeck App',
  description: 'Rundenwettkämpfe des Kreisschützenverbandes Einbeck',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <AuthProvider>
          <Header />
          <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-theme(spacing.32))]">
            {children}
          </main>
          <Toaster />
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
