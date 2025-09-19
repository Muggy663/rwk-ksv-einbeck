// Temporarily disabled Google Fonts due to build timeout
// import { Inter } from 'next/font/google';
import './globals.css';
import '@/components/ui/heading-styles.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ClubProvider } from '@/contexts/ClubContext';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AndroidLayoutFix } from '@/components/mobile/AndroidLayoutFix';
import { Metadata } from 'next';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SkipLink } from '@/components/ui/skip-link';

import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { AppUpdateChecker } from '@/components/app-update-checker';
import { NativeAppProvider } from '@/components/ui/native-app-detector';
import { AppVersionChecker } from '@/components/AppVersionChecker';

// import { SentryClientInit } from '@/components/sentry-client-init';


// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RWK KSV Einbeck - Live Tabellen & Wettkampf-Management',
  description: 'Die digitale Plattform für die Rundenwettkämpfe des Kreisschützenverbandes Einbeck',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RWK Einbeck'
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  
  return (
    <html lang="de" suppressHydrationWarning>
      <head>

        <meta name="theme-color" content="#f5f3e6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-title" content="RWK Einbeck" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <link rel="icon" href="/images/logo.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="RWK Einbeck" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="mask-icon" href="/images/logo.png" color="#1f2937" />
        <meta name="copyright" content="© 2025 KSV Einbeck" />
        <meta name="author" content="KSV Einbeck" />
        <meta name="robots" content="noarchive" />
      </head>
      <body className="font-sans app-container" suppressHydrationWarning>
        <AppVersionChecker />
        {/* Mobile Status Bar Overlay */}
        <div className="mobile-header-overlay"></div>
        <ThemeProvider>
        <NativeAppProvider>
        <AuthProvider>
          <ClubProvider>
            <div className="flex h-screen">
              <SkipLink targetId="main-content" />
              
              {/* Sidebar nur auf Desktop */}
              <div className="hidden lg:block">
                <Sidebar />
              </div>
              
              <div className="flex-1 flex flex-col">
                <Header />
                
                <div className="flex-1 overflow-auto">
                  <div className="container py-6">
                    <AppUpdateChecker />
                  </div>
                  <main id="main-content" tabIndex={-1} className="focus:outline-none">
                    {children}
                  </main>
                  <SiteFooter />
                </div>
              </div>
              
              <AndroidLayoutFix />
              <Toaster />
              <ServiceWorkerRegistration />
              <OfflineIndicator />
            </div>
          </ClubProvider>
        </AuthProvider>
        </NativeAppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
