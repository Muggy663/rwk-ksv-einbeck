// src/components/layout/SiteFooter.tsx
import Link from 'next/link';


export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const version = "1.9.2.1";

  return (
    <footer className="py-6 md:px-8 md:py-0 border-t pb-safe-area-bottom pwa-safe-footer">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="text-center md:text-left mt-2">
          <p className="text-sm leading-loose text-muted-foreground mt-2">
            © 2025{currentYear > 2025 ? `-${currentYear}` : ''} Marcel Bünger für den KSV Einbeck. Alle Rechte vorbehalten.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Für beste Kompatibilität empfehlen wir Chrome, Firefox oder Edge
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-6">
            Entwickelt mit ❤️ für den deutschen Schießsport
          </p>
        </div>
        <div className="text-center text-sm text-muted-foreground md:text-right min-w-0 flex-shrink-0">
          <div className="flex flex-col items-center md:items-end gap-3 py-2">
            <div>
              <p className="whitespace-nowrap">Web-Version {version}</p>
              <p className="text-xs mt-1 whitespace-nowrap">App-Version 0.9.4.1</p>
              <p className="text-xs mt-2 text-center md:text-right">
                <Link href="/impressum" className="text-muted-foreground hover:text-primary underline">
                  Impressum
                </Link>
                <span className="text-muted-foreground"> | </span>
                <Link href="/nutzungsbedingungen" className="text-muted-foreground hover:text-primary underline">
                  Nutzungsbedingungen
                </Link>
                <span className="text-muted-foreground"> | </span>
                <Link href="/copyright" className="text-muted-foreground hover:text-primary underline">
                  Copyright
                </Link>
                <span className="text-muted-foreground"> | </span>
                <Link 
                  href="http://www.ksv-einbeck.de/index.htm" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-primary underline"
                >
                  KSV Einbeck
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
