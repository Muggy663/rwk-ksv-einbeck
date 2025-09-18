// src/components/layout/SiteFooter.tsx
import Link from 'next/link';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const version = "1.7.3"; // Mobile UX KM-Orga: Header Overflow-Fix, KM-Orga mobile Buttons optimiert, horizontales Scrollen verhindert

  return (
    <footer className="py-6 md:px-8 md:py-0 border-t">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
        <div className="text-center md:text-left">
          <p className="text-sm leading-loose text-muted-foreground">
            © 2025{currentYear > 2025 ? `-${currentYear}` : ''} Marcel Bünger für den KSV Einbeck. Alle Rechte vorbehalten.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs mt-2">
            <Link href="/impressum" className="text-muted-foreground hover:text-primary underline">
              Impressum
            </Link>
            <Link href="/nutzungsbedingungen" className="text-muted-foreground hover:text-primary underline">
              Nutzungsbedingungen
            </Link>
            <Link href="/copyright" className="text-muted-foreground hover:text-primary underline">
              Copyright
            </Link>
            <Link 
              href="http://www.ksv-einbeck.de/index.htm" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-muted-foreground hover:text-primary underline"
            >
              KSV Einbeck
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Entwickelt mit ❤️ für den deutschen Schießsport
          </p>
        </div>
        <div className="text-center text-sm text-muted-foreground md:text-right min-w-0 flex-shrink-0">
          <p className="whitespace-nowrap">Web-Version {version} <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Beta</span></p>
          <p className="text-xs mt-1 whitespace-nowrap">App-Version 0.9.4.1</p>
        </div>
      </div>
    </footer>
  );
}
