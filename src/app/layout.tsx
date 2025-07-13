import { Inter } from 'next/font/google';
import './globals.css';
import '@/components/ui/heading-styles.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ClubProvider } from '@/contexts/ClubContext';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { MainNav } from '@/components/layout/MainNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { SkipLink } from '@/components/ui/skip-link';
import { InstallPrompt } from '@/components/ui/install-prompt';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
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
        <meta name="theme-color" content="#1f2937" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RWK Einbeck" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <link rel="icon" href="/images/logo.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="RWK Einbeck" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="mask-icon" href="/images/logo.png" color="#1f2937" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          disableTransitionOnChange
        >
        <AuthProvider>
          <ClubProvider>
            <div className="min-h-screen flex flex-col">
            <SkipLink targetId="main-content" />
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-background/95 dark:border-border">
            <div className="container flex h-14 items-center justify-between">
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
              <div className="flex items-center space-x-2">
                <ModeToggle />
                <MainNav />
              </div>
            </div>
          </header>
          <main id="main-content" tabIndex={-1} className="flex-grow focus:outline-none">
            {children}
          </main>
          <SiteFooter />
          <Toaster />
          <ServiceWorkerRegistration />
          <InstallPrompt />
          <OfflineIndicator />
          {/* <SentryClientInit /> */}
            </div>
          </ClubProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}