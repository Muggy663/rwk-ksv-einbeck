import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { MainNav } from '@/components/layout/MainNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import Link from 'next/link';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RWK App Einbeck',
  description: 'Die digitale Plattform für die Rundenwettkämpfe des Kreisschützenverbandes Einbeck',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <Script src="/disable-onboarding.js" strategy="beforeInteractive" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                <span className="hidden font-bold sm:inline-block text-lg">RWK Einbeck</span>
              </Link>
              <MainNav />
            </div>
          </header>
          <main>
            {children}
          </main>
          <SiteFooter />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}