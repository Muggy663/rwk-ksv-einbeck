import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function CopyrightPage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-primary">Copyright</h1>
      <p className="text-muted-foreground mb-6">Urheberrechtliche Informationen zur RWK Einbeck App</p>
      
      <Separator className="my-6" />
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Copyright-Hinweis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-semibold">Copyright © 2025 KSV Einbeck</p>
          
          <p>Alle Inhalte dieser Website und der RWK Einbeck App, einschließlich:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Software-Code</li>
            <li>Texte und Dokumentation</li>
            <li>Grafiken und Design-Elemente</li>
            <li>Datenbank-Strukturen</li>
            <li>Benutzeroberflächen</li>
          </ul>
          
          <p>sind urheberrechtlich geschützt und Eigentum des KSV Einbeck.</p>
          
          <p>Jede Vervielfältigung, Verbreitung, öffentliche Wiedergabe oder sonstige Nutzung ohne ausdrückliche schriftliche Genehmigung ist untersagt und kann rechtlich verfolgt werden.</p>
        </CardContent>
      </Card>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Nutzungsbedingungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">Erlaubte Nutzung</h3>
          <p>Die RWK Einbeck App darf ausschließlich für die Verwaltung von Rundenwettkämpfen des KSV Einbeck genutzt werden.</p>
          
          <h3 className="font-semibold">Verbotene Aktivitäten</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Reverse Engineering oder Dekompilierung der Software</li>
            <li>Entfernung von Copyright-Hinweisen</li>
            <li>Kommerzielle Nutzung oder Weiterverbreitung</li>
            <li>Unbefugter Zugriff auf Daten anderer Nutzer</li>
          </ul>
          
          <h3 className="font-semibold">Haftungsausschluss</h3>
          <p>Die Software wird "wie sie ist" zur Verfügung gestellt, ohne jegliche ausdrückliche oder implizite Garantie.</p>
          
          <h3 className="font-semibold">Kontakt für Copyright-Anfragen</h3>
          <p>Für Anfragen bezüglich Urheberrechten und Lizenzen:</p>
          <p>E-Mail: rwk-leiter-ksve@gmx.de</p>
        </CardContent>
      </Card>
      
      <div className="text-center">
        <Link href="/" className="text-primary hover:underline">
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}
