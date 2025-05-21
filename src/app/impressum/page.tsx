// src/app/impressum/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookUser } from 'lucide-react';

export default function ImpressumPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <BookUser className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Impressum</h1>
          <p className="text-lg text-muted-foreground">
            Angaben gemäß § 5 TMG
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-accent">Verantwortlich für den Inhalt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            <strong>Kreisschützenverband Einbeck e.V.</strong>
          </p>
          <p>
            <em>Vorname Nachname des Vertretungsberechtigten</em><br />
            <em>Straße Hausnummer</em><br />
            <em>PLZ Ort</em>
          </p>
          <p>
            <strong>Kontakt:</strong><br />
            Telefon: <em>Telefonnummer hier eintragen</em><br />
            E-Mail: <em>E-Mail-Adresse hier eintragen</em>
          </p>
          <p>
            <strong>Registereintrag:</strong><br />
            Eintragung im Vereinsregister.<br />
            Registergericht: <em>Amtsgericht [Ort]</em><br />
            Registernummer: <em>VR [Nummer]</em>
          </p>
          <p className="text-sm text-muted-foreground mt-6">
            <strong>Wichtiger Hinweis:</strong> Dies ist ein Platzhalter-Impressum. Bitte ersetzen Sie die kursiv gedruckten Angaben durch Ihre korrekten und vollständigen Daten. Konsultieren Sie bei Unsicherheiten eine Rechtsberatung.
          </p>
        </CardContent>
      </Card>

       <Card className="shadow-md mt-6">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Haftungsausschluss</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p><strong>Haftung für Inhalte</strong></p>
            <p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
            <p>Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.</p>
            <p><strong>Datenschutz</strong></p>
            <p>Die Nutzung unserer Webseite ist in der Regel ohne Angabe personenbezogener Daten möglich. Soweit auf unseren Seiten personenbezogene Daten (beispielsweise Name, Anschrift oder E-Mail-Adressen) erhoben werden, erfolgt dies, soweit möglich, stets auf freiwilliger Basis. Diese Daten werden ohne Ihre ausdrückliche Zustimmung nicht an Dritte weitergegeben.</p>
            <p>Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.</p>
        </CardContent>
      </Card>
    </div>
  );
}
