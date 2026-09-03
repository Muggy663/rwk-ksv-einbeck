// src/components/layout/SiteFooter.tsx
import Link from 'next/link';
import { APP_VERSION } from '@/lib/version';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-6 md:px-8 md:py-0 border-t pb-safe-area-bottom pwa-safe-footer">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="text-center md:text-left mt-2">
          <p className="text-sm leading-loose text-muted-foreground mt-2">
            © 2025{currentYear > 2025 ? `-${currentYear}` : ''} Marcel Bünger für den KSV Einbeck. Alle Rechte vorbehalten.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Für beste Kompatibilität empfehlen wir Chrome, Firefox, Edge oder Safari (iOS)
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Entwickelt mit ❤️ für den deutschen Schießsport
          </p>
          <a
            href="https://github.com/Muggy663/rwk-ksv-einbeck"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-6"
            aria-label="Quellcode auf GitHub ansehen"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
              aria-hidden="true"
              className="flex-shrink-0"
            >
              <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.575.106.785-.25.785-.556 0-.274-.01-1.002-.015-1.967-3.196.695-3.87-1.54-3.87-1.54-.523-1.328-1.277-1.682-1.277-1.682-1.043-.713.08-.699.08-.699 1.153.081 1.76 1.184 1.76 1.184 1.026 1.758 2.693 1.25 3.35.957.104-.744.402-1.25.73-1.538-2.552-.29-5.236-1.276-5.236-5.68 0-1.255.448-2.28 1.183-3.084-.119-.29-.513-1.459.112-3.042 0 0 .965-.309 3.163 1.178a10.98 10.98 0 0 1 2.88-.388c.977.004 1.962.132 2.88.388 2.197-1.487 3.16-1.178 3.16-1.178.627 1.583.233 2.752.114 3.042.737.804 1.182 1.829 1.182 3.084 0 4.415-2.688 5.386-5.248 5.67.413.356.78 1.057.78 2.132 0 1.54-.014 2.78-.014 3.158 0 .308.207.668.79.554A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
            </svg>
            Quellcode auf GitHub
          </a>
        </div>
        <div className="text-center text-sm text-muted-foreground md:text-right min-w-0 flex-shrink-0">
          <div className="flex flex-col items-center md:items-end gap-3 py-2">
            <div>
              <p className="whitespace-nowrap">Web-Version {APP_VERSION.web}</p>
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
