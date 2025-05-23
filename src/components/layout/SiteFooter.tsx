// src/components/layout/SiteFooter.tsx
import Link from 'next/link';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const version = "0.3.2"; // Aktualisierte Version

  return (
    <footer className="py-6 md:px-8 md:py-0 border-t">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
        <div className="text-center md:text-left">
          <p className="text-sm leading-loose text-muted-foreground">
            &copy; {currentYear} KSV Einbeck. Alle Rechte vorbehalten.
          </p>
          <Link href="/impressum" className="text-xs text-muted-foreground hover:text-primary underline">
            Impressum
          </Link>
        </div>
        <p className="text-center text-sm text-muted-foreground md:text-right">
          Version {version}
        </p>
      </div>
    </footer>
  );
}
