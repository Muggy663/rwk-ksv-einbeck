import { Inter } from 'next/font/google';
import './globals.css';
import '@/components/ui/heading-styles.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ClubProvider } from '@/contexts/ClubContext';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { MainNav } from '@/components/layout/MainNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { MobileLayout, MobileHeader, MobileContent } from '@/components/layout/MobileLayout';
import { MobileBurgerMenu } from '@/components/mobile/MobileBurgerMenu';
import { AndroidLayoutFix } from '@/components/mobile/AndroidLayoutFix';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlobalSearch } from '@/components/GlobalSearch';
import { SkipLink } from '@/components/ui/skip-link';

import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { AppUpdateChecker } from '@/components/app-update-checker';
import { NativeAppProvider } from '@/components/ui/native-app-detector';
import { AppVersionChecker } from '@/components/AppVersionChecker';

// import { SentryClientInit } from '@/components/sentry-client-init';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RWK App Einbeck',
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
        <Script src="/disable-onboarding.js" strategy="beforeInteractive" />
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
      <body className={`${inter.className} app-container`} suppressHydrationWarning>
        <AppVersionChecker />
        {/* Mobile Status Bar Overlay */}
        <div className="mobile-header-overlay"></div>
        <ThemeProvider>
        <NativeAppProvider>
        <AuthProvider>
          <ClubProvider>
            <MobileLayout>
              <SkipLink targetId="main-content" />
              
              <MobileHeader>
                <Link href="/" className="flex items-center space-x-2">
                  <Image 
                    src="/images/logo.png" 
                    alt="KSV Einbeck Logo Klein" 
                    width={40} 
                    height={40}
                    className="rounded-md"
                    style={{ width: 40, height: 40 }}
                    data-ai-hint="club logo"
                  />
                  <span className="hidden font-bold sm:inline-block text-lg text-foreground">RWK Einbeck</span>
                </Link>
                
                <div className="flex-1 max-w-md mx-4 hidden md:block">
                  <div className="global-search-container">
                    <GlobalSearch />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <ThemeToggle />
                  <div className="hidden md:block">
                    <MainNav />
                  </div>
                  <div className="md:hidden">
                    <MobileBurgerMenu />
                  </div>
                </div>
              </MobileHeader>
              
              <MobileContent>
                <div className="container">
                  <AppUpdateChecker />
                </div>
                <main id="main-content" tabIndex={-1} className="focus:outline-none">
                  {children}
                </main>
                <SiteFooter />
              </MobileContent>
              

              
              <AndroidLayoutFix />
              <Toaster />
              <ServiceWorkerRegistration />
              <OfflineIndicator />
            </MobileLayout>
          </ClubProvider>
        </AuthProvider>
        </NativeAppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
