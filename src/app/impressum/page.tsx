// src/app/impressum/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookUser } from 'lucide-react';

export default function ImpressumPage() {
  return (
    <div className="space-y-8 container mx-auto px-4 py-8">
      <div className="flex items-center space-x-3 mb-8">
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
          <CardTitle className="text-2xl text-accent">Kreisschützenverband Einbeck e.V.</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Vereinsregister 150024
          </p>
          <p>
            E-Mail: sander-lars@t-online.de
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Präsident</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Lars Sander</p>
          <p>Theodor-Heuss-Weg 11</p>
          <p>37574 Einbeck-Salzderhelden</p>
          <p>E-Mail: sander-lars@t-online.de</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Verantwortlicher für die Homepage i.S.d. § 5 Telemediengesetz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Marcel Bünger</p>
          <p>Rundenwettkampfleiter</p>
          <p>Luisenstr. 10</p>
          <p>37574 Einbeck</p>
          <p>E-Mail: rwk-leiter-ksve@gmx.de</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Datenschutzbeauftragter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Sven Rössing</p>
          <p>Mühlenbergstraße 19</p>
          <p>37627 Wangelnstedt</p>
          <p>E-Mail: Sven_Roessing@web.de</p>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Haftungshinweis</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>Obwohl bei der Entwicklung der Materialien mit größter Sorgfalt umgegangen wird, können Fehler nicht ausgeschlossen werden. Die Autoren und der Herausgeber können für fehlerhafte Angaben und deren Folgen weder eine juristische Verantwortung noch irgendeine Haftung übernehmen. Für Verbesserungsvorschläge sind die Autoren dankbar.</p>
          <p>Mit Urteil vom 12. Mai 1998 hat das Landgericht Hamburg entschieden, daß man durch die Ausbringung eines Links die Inhalte der gelinkten Seite ggf. mit zu verantworten hat. Dies kann - so das LG - nur dadurch verhindert werden, dass man sich ausdrücklich von diesen Inhalten distanziert. Wir haben auf dieser Webseite Links zu anderen Seiten im Internet gelegt. Für all diese Links gilt: Wir möchten ausdrücklich betonen, dass wir keinerlei Einfluss auf die Gestaltung und die Inhalte der gelinkten Seiten habe. Deshalb distanzieren wir uns hiermit ausdrücklich von allen Inhalten aller gelinkten Seiten auf unserer Homepage.</p>
          <p>Durch diese Webseite werden keinerlei kommerzielle Interessen verfolgt. Links zu kommerziellen Webseiten sollten nicht als Werbung für oder gegen die entsprechende Webseite angesehen werden.</p>
        </CardContent>
      </Card>
      
      <Separator className="my-6" />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl text-accent">Datenschutzerklärung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-xs text-muted-foreground">Download (Platzhalter, falls separate Datei verlinkt werden soll)</p>
          <p>Diese Datenschutzerklärung klärt Sie über die Art, den Umfang und Zweck der Verarbeitung von personenbezogenen Daten (nachfolgend kurz „Daten“) innerhalb unseres Onlineangebotes und der mit ihm verbundenen Webseiten, Funktionen und Inhalte sowie externen Onlinepräsenzen, wie z.B. unser Social Media Profile auf (nachfolgend gemeinsam bezeichnet als „Onlineangebot“). Im Hinblick auf die verwendeten Begrifflichkeiten, wie z.B. „Verarbeitung“ oder „Verantwortlicher“ verweisen wir auf die Definitionen im Art. 4 der Datenschutzgrundverordnung (DSGVO).</p>
          
          <div>
            <h3 className="font-semibold text-md mt-3 mb-1 text-foreground">Verantwortlicher</h3>
            <p>Lars Sander</p>
            <p>Theodor-Heuss-Weg 11</p>
            <p>37574 Einbeck-Salzderhelden</p>
            <p>E-Mail: sander-lars@t-online.de</p>
          </div>

          <div>
            <h3 className="font-semibold text-md mt-3 mb-1 text-foreground">Arten der verarbeiteten Daten:</h3>
            <ul className="list-disc list-inside pl-4">
              <li>Bestandsdaten (z.B., Namen, Adressen).</li>
              <li>Kontaktdaten (z.B., E-Mail, Telefonnummern).</li>
              <li>Inhaltsdaten (z.B., Texteingaben, Fotografien, Videos).</li>
              <li>Nutzungsdaten (z.B., besuchte Webseiten, Interesse an Inhalten, Zugriffszeiten).</li>
              <li>Meta-/Kommunikationsdaten (z.B., Geräte-Informationen, IP-Adressen).</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-md mt-3 mb-1 text-foreground">Kategorien betroffener Personen</h3>
            <p>Besucher und Nutzer des Onlineangebotes (Nachfolgend bezeichnen wir die betroffenen Personen zusammenfassend auch als „Nutzer“).</p>
          </div>

          <div>
            <h3 className="font-semibold text-md mt-3 mb-1 text-foreground">Zweck der Verarbeitung</h3>
            <ul className="list-disc list-inside pl-4">
              <li>Zurverfügungstellung des Onlineangebotes, seiner Funktionen und Inhalte.</li>
              <li>Beantwortung von Kontaktanfragen und Kommunikation mit Nutzern.</li>
              <li>Sicherheitsmaßnahmen.</li>
              <li>Reichweitenmessung/Marketing</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-md mt-3 mb-1 text-foreground">Verwendete Begrifflichkeiten</h3>
            <p>„Personenbezogene Daten“ sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person (im Folgenden „betroffene Person“) beziehen; als identifizierbar wird eine natürliche Person angesehen, die direkt oder indirekt, insbesondere mittels Zuordnung zu einer Kennung wie einem Namen, zu einer Kennnummer, zu Standortdaten, zu einer Online-Kennung (z.B. Cookie) oder zu einem oder mehreren besonderen Merkmalen identifiziert werden kann, die Ausdruck der physischen, physiologischen, genetischen, psychischen, wirtschaftlichen, kulturellen oder sozialen Identität dieser natürlichen Person sind.</p>
            <p>„Verarbeitung“ ist jeder mit oder ohne Hilfe automatisierter Verfahren ausgeführte Vorgang oder jede solche Vorgangsreihe im Zusammenhang mit personenbezogenen Daten. Der Begriff reicht weit und umfasst praktisch jeden Umgang mit Daten.</p>
            {/* Weitere Definitionen hier einfügen, falls nötig */}
            <p>Als „Verantwortlicher“ wird die natürliche oder juristische Person, Behörde, Einrichtung oder andere Stelle, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten entscheidet, bezeichnet.</p>
            <p>„Auftragsverarbeiter“ eine natürliche oder juristische Person, Behörde, Einrichtung oder andere Stelle, die personenbezogene Daten im Auftrag des Verantwortlichen verarbeitet.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-md mt-3 mb-1 text-foreground">Maßgebliche Rechtsgrundlagen</h3>
            <p>Nach Maßgabe des Art. 13 DSGVO teilen wir Ihnen die Rechtsgrundlagen unserer Datenverarbeitungen mit. Sofern die Rechtsgrundlage in der Datenschutzerklärung nicht genannt wird, gilt Folgendes: Die Rechtsgrundlage für die Einholung von Einwilligungen ist Art. 6 Abs. 1 lit. a und Art. 7 DSGVO, die Rechtsgrundlage für die Verarbeitung zur Erfüllung unserer Leistungen und Durchführung vertraglicher Maßnahmen sowie Beantwortung von Anfragen ist Art. 6 Abs. 1 lit. b DSGVO, die Rechtsgrundlage für die Verarbeitung zur Erfüllung unserer rechtlichen Verpflichtungen ist Art. 6 Abs. 1 lit. c DSGVO, und die Rechtsgrundlage für die Verarbeitung zur Wahrung unserer berechtigten Interessen ist Art. 6 Abs. 1 lit. f DSGVO. Für den Fall, dass lebenswichtige Interessen der betroffenen Person oder einer anderen natürlichen Person eine Verarbeitung personenbezogener Daten erforderlich machen, dient Art. 6 Abs. 1 lit. d DSGVO als Rechtsgrundlage.</p>
          </div>

          <div>
            <h3 className="font-semibold text-md mt-3 mb-1 text-foreground">Sicherheitsmaßnahmen</h3>
            <p>Wir treffen nach Maßgabe des Art. 32 DSGVO unter Berücksichtigung des Stands der Technik, der Implementierungskosten und der Art, des Umfangs, der Umstände und der Zwecke der Verarbeitung sowie der unterschiedlichen Eintrittswahrscheinlichkeit und Schwere des Risikos für die Rechte und Freiheiten natürlicher Personen, geeignete technische und organisatorische Maßnahmen, um ein dem Risiko angemessenes Schutzniveau zu gewährleisten.</p>
            <p>Zu den Maßnahmen gehören insbesondere die Sicherung der Vertraulichkeit, Integrität und Verfügbarkeit von Daten durch Kontrolle des physischen Zugangs zu den Daten, als auch des sie betreffenden Zugriffs, der Eingabe, Weitergabe, der Sicherung der Verfügbarkeit und ihrer Trennung. Des Weiteren haben wir Verfahren eingerichtet, die eine Wahrnehmung von Betroffenenrechten, Löschung von Daten und Reaktion auf Gefährdung der Daten gewährleisten. Ferner berücksichtigen wir den Schutz personenbezogener Daten bereits bei der Entwicklung, bzw. Auswahl von Hardware, Software sowie Verfahren, entsprechend dem Prinzip des Datenschutzes durch Technikgestaltung und durch datenschutzfreundliche Voreinstellungen (Art. 25 DSGVO).</p>
          </div>

          <div>
            <h3 className="font-semibold text-md mt-3 mb-1 text-foreground">Zusammenarbeit mit Auftragsverarbeitern und Dritten</h3>
            <p>Sofern wir im Rahmen unserer Verarbeitung Daten gegenüber anderen Personen und Unternehmen (Auftragsverarbeitern oder Dritten) offenbaren, sie an diese übermitteln oder ihnen sonst Zugriff auf die Daten gewähren, erfolgt dies nur auf Grundlage einer gesetzlichen Erlaubnis (z.B. wenn eine Übermittlung der Daten an Dritte, wie an Zahlungsdienstleister, gem. Art. 6 Abs. 1 lit. b DSGVO zur Vertragserfüllung erforderlich ist), Sie eingewilligt haben, eine rechtliche Verpflichtung dies vorsieht oder auf Grundlage unserer berechtigten Interessen (z.B. beim Einsatz von Beauftragten, Webhostern, etc.).</p>
            <p>Sofern wir Dritte mit der Verarbeitung von Daten auf Grundlage eines sog. „Auftragsverarbeitungsvertrages“ beauftragen, geschieht dies auf Grundlage des Art. 28 DSGVO.</p>
          </div>
          
          {/* Weitere Abschnitte der Datenschutzerklärung hier einfügen (Übermittlungen, Rechte, Cookies, Löschung, Hosting etc.) */}
          {/* Für Kürze hier ausgelassen, aber im Originaltext vorhanden */}
          <div>
            <h3 className="font-semibold text-md mt-3 mb-1 text-foreground">Löschung von Daten</h3>
            <p>Die von uns verarbeiteten Daten werden nach Maßgabe der Art. 17 und 18 DSGVO gelöscht oder in ihrer Verarbeitung eingeschränkt. [...]</p>
          </div>
           <div>
            <h3 className="font-semibold text-md mt-3 mb-1 text-foreground">Hosting und E-Mail-Versand</h3>
            <p>Die von uns in Anspruch genommenen Hosting-Leistungen dienen der Zurverfügungstellung der folgenden Leistungen: [...]</p>
          </div>
           <div>
            <h3 className="font-semibold text-md mt-3 mb-1 text-foreground">Erhebung von Zugriffsdaten und Logfiles</h3>
            <p>Wir, bzw. unser Hostinganbieter, erhebt auf Grundlage unserer berechtigten Interessen im Sinne des Art. 6 Abs. 1 lit. f. DSGVO Daten über jeden Zugriff auf den Server, auf dem sich dieser Dienst befindet (sogenannte Serverlogfiles). [...]</p>
          </div>
           <p className="mt-6 text-xs text-muted-foreground">Erstellt mit Datenschutz-Generator.de von RA Dr. Thomas Schwenke</p>
        </CardContent>
      </Card>
    </div>
  );
}
