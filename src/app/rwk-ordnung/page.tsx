// src/app/rwk-ordnung/page.tsx
"use client"; // Good practice, though not strictly needed for static content yet
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollText } from 'lucide-react';

export default function RwkOrdnungPage() {
  return (
    <div className="space-y-8 container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-3 mb-8">
        <ScrollText className="h-8 w-8 sm:h-10 sm:w-10 text-primary flex-shrink-0" />
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary break-words">Rundenwettkampfordnung</h1>
          <p className="text-base sm:text-lg text-muted-foreground break-words">
            des Kreisschützenverbandes Einbeck e.V.
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Rundenwettkampfordnung des Kreisschützenverbandes Einbeck</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Ausgestellt am 27. September 1982 – Überarbeitet Januar 2025</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose-base lg:prose-lg prose-headings:text-accent prose-strong:text-foreground dark:prose-invert text-foreground space-y-3 max-w-none overflow-x-auto">
          <div className="text-center mb-6">
            <p>Die Kreisschießsportleiterin <br /><strong>Angelika Kappei</strong></p>
            <p className="mt-2">Der Rundenwettkampfleiter <br /><strong>Marcel Bünger</strong></p>
          </div>
          
          <h3 className="font-semibold text-lg mt-4 !text-primary border-b pb-1">Inhaltsverzeichnis</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm pl-5">
            <li><a href="#section-1" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Veranstalter der Rundenwettkämpfe</a></li>
            <li><a href="#section-2" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Zweck der Rundenwettkämpfe</a></li>
            <li><a href="#section-3" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Disziplinen</a></li>
            <li><a href="#section-4" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Wettkampftermine und -orte</a></li>
            <li><a href="#section-5" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Meldungen und Einteilung in Gruppen</a></li>
            <li><a href="#section-6" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Klasseneinteilung</a></li>
            <li><a href="#section-7" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Startberechtigung</a></li>
            <li><a href="#section-8" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Schießstände</a></li>
            <li><a href="#section-9" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Startgelder</a></li>
            <li><a href="#section-10" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Vorschießen oder Nachschießen</a></li>
            <li><a href="#section-11" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Protokollführung</a></li>
            <li><a href="#section-12" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Mannschaftswechsel und Ersatzschützen</a></li>
            <li><a href="#section-13" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Siegerehrung</a></li>
            <li><a href="#section-14" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Einsprüche/Unstimmigkeiten</a></li>
            <li><a href="#section-15" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Betrug/Betrugsversuch</a></li>
            <li><a href="#section-16" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Auf- und Abstieg auf Kreisebene</a></li>
            <li><a href="#section-17" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Auf- und Abstieg in die Bezirksliga/Landesliga</a></li>
            <li><a href="#section-18" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Änderungen</a></li>
            <li><a href="#section-19" className="text-primary hover:text-primary/80 hover:underline cursor-pointer">Schlussbemerkung</a></li>
          </ol>

          <Separator className="my-6" />

          <div>
            <h4 id="section-1" className="font-semibold text-md !text-primary mt-3">1. Veranstalter der Rundenwettkämpfe</h4>
            <p>Veranstalter der Rundenwettkämpfe ist der Kreisschützenverband Einbeck, nachfolgend KSV Einbeck (oder auch KSVE) genannt. Verantwortlich für die Vorbereitung, Klasseneinteilung, Leitung, Überwachung und Einhaltung der Regeln der alljährlichen durchzuführenden Rundenwettkämpfe ist der Rundenwettkampfleiter, nachfolgend „RWK-Leiter“ genannt. Der Gesamtvorstand schlägt einen Rundenwettkampfleiter vor, der beim Kreisschützentag durch die Delegierten gewählt wird. Maßgebend für die Abwicklung der Rundenwettkämpfe ist die jeweils aktuell gültige Sportordnung des Deutschen Schützenbundes.</p>
            <p>Aus Vereinfachung werden in dieser RWK-Ordnung Wörter und Begriffe nur in der männlichen Form gebraucht. Sie gelten auch in der weiblichen Form.</p>
          </div>

          <div>
            <h4 id="section-2" className="font-semibold text-md !text-primary mt-3">2. Zweck der Rundenwettkämpfe</h4>
            <p>Die Rundenwettkämpfe innerhalb des KSV Einbeck dienen der Belebung und Förderung des Schießsports, und sie sollen den Schützen Gelegenheit geben, ihre Schießleistungen zu steigern, Wettkampferfahrung zu sammeln und das Kennenlernen der Schützen untereinander fördern. Ein RWK wird als Mannschaftswettbewerb ausgeschrieben, es besteht aber auch die Möglichkeit als Einzelschütze zu starten.</p>
          </div>

          <div>
            <h4 id="section-3" className="font-semibold text-md !text-primary mt-3">3. Disziplinen</h4>
            <p>Der Rundenwettkampf Luftdruckwaffen beginnt am 1. Oktober und endet am 1. März des darauffolgenden Jahres.</p>
            <ul className="list-disc list-inside pl-5 space-y-2">
              <li>
                <strong>11.11 Lichtpunktgewehr Auflage</strong> 20 Schuss<br />
                Startberechtigt sind Schützen ab 6 bis 12 Jahre
              </li>
              <li>
                <strong>1.10 Luftgewehr Freihand</strong> 40 Schuss<br />
                Startberechtigt sind Schützen ab 15 Jahre<br />
                Startberechtigt sind Schüler ab 12 bis 14 Jahre mit 20 Schuss
              </li>
              <li>
                <strong>1.11 Luftgewehr Auflage</strong> 30 Schuss<br />
                Startberechtigt sind Schützen ab 41 Jahre bzw. zwischen 12 und 14 Jahre im Jugendbereich
              </li>
              <li>
                <strong>2.10 Luftpistole</strong> 40 Schuss<br />
                Startberechtigt sind Schützen ab 15 Jahre<br />
                Startberechtigt sind Schüler ab 12 bis 14 Jahre mit 20 Schuss Luftpistole Auflage
              </li>
            </ul>
            <p className="mt-2">Die Siegerehrung findet mit der Siegerehrung der Kreismeisterschaft statt.</p>
            <p className="mt-2">Der Rundenwettkampf Kleinkaliber beginnt am 01. Mai und endet am 15. August.</p>
            <ul className="list-disc list-inside pl-5 space-y-2">
              <li>
                <strong>1.41 Kleinkalibergewehr Auflage</strong> 30 Schuss<br />
                Startberechtigt sind Schützen ab 15 Jahre
              </li>
              <li>
                <strong>2.40 KK-Sportpistole</strong> 30 Schuss<br />
                Startberechtigt sind Schützen ab 17 Jahre
              </li>
            </ul>
            <p className="mt-2">Die Siegerehrung findet mit der Siegerehrung des Ilmepokalschießens statt.</p>
          </div>

          <div>
            <h4 id="section-4" className="font-semibold text-md !text-primary mt-3">4. Wettkampftermine und -orte</h4>
            <p>Der RWK-Leiter setzt jeweils nur den ersten Wettkampfort fest. Dies ist in der Gruppeneinteilung die zuerst genannte Mannschaft. Die nachfolgenden Termine und Orte sind in den jeweiligen Gruppen selbstständig festzulegen. Folgetermine sind jeweils auf dem Wettkampfprotokoll zu notieren, so dass diese allen Teilnehmern bekannt werden können.</p>
            <p>Sollte der jeweils erste Wettkampf einer Gruppe nicht an dem vom RWK-Leiter festgelegten Ort stattfinden können, so hat der Sportleiter des Vereins oder Mannschaftsführer, der eigentlich als Gastgeber vorgesehen war, für einen abweichenden Austragungsort Sorge zu tragen und die anderen Mannschaften hierüber zu informieren.</p>
          </div>

          <div>
            <h4 id="section-5" className="font-semibold text-md !text-primary mt-3">5. Meldungen und Einteilung der Gruppen</h4>
            <p>Der RWK-Leiter setzt rechtzeitig vor Saisonbeginn die Ausschreibungen zur Teilnahme an den Rundenwettkämpfen auf und versendet diese auf digitalem Wege an die jeweiligen Sportleiter aller dem Kreisschützenverband Einbeck e.V. angeschlossenen Vereine.</p>
            <p>Die Meldezettel müssen von den Vereinen ausgefüllt und rechtzeitig zum, durch den RWK-Leiter festgesetzten Termin (Für den RWK Lichtpunkt, Luftgewehr und Luftpistole bis zum Ilmepokalschießen, für den RWK KK-Gewehr und Sportpistole bis zum 31. März) zurückgesendet werden. Verspätete Meldungen können in Ausnahmefällen berücksichtigt werden, jedoch nicht mehr nach Bekanntgabe der Gruppeneinteilung.</p>
            <p>Der RWK-Leiter fasst alle Meldungen zusammen und erstellt daraus die Gruppeneinteilungen in den einzelnen Disziplinen unter Berücksichtigung der Auf- und Abstiege der letzten Saison. Diese Einteilungen werden dann den jeweiligen Sportleitern der Vereine und Mannschaftsführern zugestellt. Als Mannschaftsführer und damit Ansprechpartner gilt die erstgenannte Person der Mannschaften. Bei Änderung des Mannschaftsführers, ist der RWK-Leiter zu Informieren.</p>
            <p>Jede Mannschaft besteht aus 3 Schützen.</p>
            <p>Tritt eine Mannschaft ohne triftigen Grund nicht zum Wettkampf an, so scheidet sie aus. Das Startgeld verfällt.</p>
          </div>
          
          <div>
            <h4 id="section-6" className="font-semibold text-md !text-primary mt-3">6. Klasseneinteilung</h4>
            <p>Die Einteilung erfolgt in folgenden Klassen:</p>
            <ul className="list-disc list-inside pl-5 space-y-1">
                <li>Lichtpunktgewehr Auflage</li>
                <li>Schüler Klasse Luftgewehr Freihand (12 – 14 Jahre)</li>
                <li>Schüler Klasse Luftgewehr Auflage (12 – 14 Jahre)</li>
            </ul>
            <p>In diesen RWK‘s gibt es nur Einzelstarts, außer es melden sich mindestens 4 Mannschaften.</p>
            <p>Offene Klasse Luftgewehr Freihand (ab 15 Jahre)</p>
            <p>Luftgewehr Auflage (ab 15 Jahre): (ohne Altersbezogene Wertung)</p>
            <ul className="list-disc list-inside pl-8 space-y-0.5">
                <li>Kreisoberliga</li>
                <li>Kreisliga</li>
                <li>1. Kreisklasse</li>
                <li>usw.</li>
            </ul>
            <p>Offene Klasse Luftpistole Freihand (ab 15 Jahre)</p>
            <p>Schüler Klasse Luftpistole Freihand (12 – 14 Jahre)</p>
            <p>In diesem RWK gibt es nur Einzelstarts, außer es melden sich mindestens 4 Mannschaften.</p>
            <p>Offene Klasse Luftpistole Auflage (ab 15 Jahre)</p>
            <p>Schüler Klasse Luftpistole Auflage (12 – 14 Jahre)</p>
            <p>In diesem RWK gibt es nur Einzelstarts, außer es melden sich mindestens 4 Mannschaften.</p>
            <p>Die Rundenwettkämpfe KK werden in den folgenden zwei Disziplinen geschossen: Gewehr und Sportpistole.</p>
            <p>KK-Gewehr Auflage (ab 15 Jahre): (ohne Altersbezogene Wertung)</p>
             <ul className="list-disc list-inside pl-8 space-y-0.5">
                <li>Kreisoberliga</li>
                <li>Kreisliga</li>
                <li>1. Kreisklasse</li>
                <li>usw.</li>
            </ul>
            <p>In der Disziplin Sport-Pistole erfolgt keine Klasseneinteilung.</p>
          </div>

          <div>
            <h4 id="section-7" className="font-semibold text-md !text-primary mt-3">7. Startberechtigung</h4>
            <p>Startberechtigt sind ausschließlich Mitglieder des KSV Einbeck die über ihren Verein dem NSSV gemeldet sind und ausreichend gegen Haftpflicht und Unfall versichert sind. Schießsportgemeinschaften, die nicht als Verein gemeldet sind, sind in diesem Wettkampf nicht startberechtigt.</p>
            <p>Ist ein Teilnehmer in mehreren Vereinen aktiv, so kann er frei wählen für welchen Verein und in welcher Disziplin er starten möchte. Er ist pro Disziplin nur für einen Verein startberechtigt. Doppelstarts in den Ligen des NSSV (oder anderer Landesverbände) und des KSV sind nicht zulässig. Teilnehmer werden in diesen Fällen „AK - außer Konkurrenz“- gewertet.</p>
            <p>Startet ein Verein zum 1. Mal bei den Rundenwettkämpfen, so muss die Mannschaft in der untersten Klasse beginnen. Einzelschützen werden den jeweiligen Mannschaften zwecks Fahrgemeinschaften zugeordnet. Erst im darauffolgenden Jahr kann ein Aufstieg in die nächst höhere Leistungsklasse erfolgen.</p>
          </div>

          <div>
            <h4 id="section-8" className="font-semibold text-md !text-primary mt-3">8. Schießstände</h4>
            <p>Der gastgebende Verein stellt sicher, dass sich zum angesetzten Wettkampftermin qualifiziertes Personal zur Durchführung und Leitung des jeweiligen Wettkampfs auf dem Schießstand befindet.</p>
            <p>Der gastgebende Verein stellt laut Ausschreibung zugelassene Scheiben, Scheibenstreifen oder gegebenenfalls elektronische Anlagen zur Verfügung. Für passende Sportgeräte und Munition hat jeder Teilnehmer selbst zu sorgen. Beschossene Scheiben, sowie bei elektronischen Anlagen Kopien des maschinellen Wettkampfprotokolls, müssen bis nach der Siegerehrung aufbewahrt werden.</p>
            <p>Die Teilnehmer müssen sich selbstständig erkundigen, ob der gastgebende Verein für die eigenen Bedürfnisse hinreichend ausgestattet ist. Gegebenenfalls hat der Teilnehmer dafür zu sorgen, dass die Teilnahme am Wettkampf überhaupt möglich wird, z.B. durch das Mitbringen eines Hockers für das Schießen im Sitzen (gem. SpO T. 9).</p>
          </div>
          
          <div>
            <h4 id="section-9" className="font-semibold text-md !text-primary mt-3">9. Startgelder</h4>
            <p>Die Höhe des Startgeldes wird auf der Delegiertenversammlung beim Kreisschützentag festgesetzt und vom Kreisschatzmeister den Vereinen in Rechnung gestellt.</p>
          </div>

          <div>
            <h4 id="section-10" className="font-semibold text-md !text-primary mt-3">10. Vorschießen oder Nachschießen</h4>
            <p>Zwischen den Durchgängen sollen drei (3) Wochen Zeit liegen, um verhinderten Schützen (z.B. Schichtarbeitern, Erkrankung des Schützen, Urlaub) Gelegenheit zum Vor- oder Nachschießen zu geben. Eine Verkürzung der 3 Wochenfristen ist nur mit Zustimmung und Absprache der zur Gruppe gehörenden Mannschaftsführer einvernehmlich gestattet.</p>
            <p>Es soll nur zwischen den Durchgängen der zuletzt geschossene Durchgang nachgeschossen werden.</p>
            <p>Ein Nachschießen von aufeinanderfolgenden Durchgängen ist nicht zulässig.</p>
            <p>Ein Vor- oder Nachschießen ist nur auf dem Stand gestattet, wo der Durchgang auch stattfindet oder stattfand. Eine Ausnahme, ist nur mit Zustimmung und Absprache der zur Gruppe gehörenden Mannschaftsführer einvernehmlich gestattet.</p>
            <p>Die am Vor- bzw. Nachschießtermin beschossenen Scheiben dürfen durch dafür qualifiziertes Personal noch vor Ort ausgewertet werden.</p>
          </div>

          <div>
            <h4 id="section-11" className="font-semibold text-md !text-primary mt-3">11. Protokollführung</h4>
            <p>Wettkampfprotokolle sind zu jedem Wettkampf zu führen. Es sind immer die aktuellen Formulare zu verwenden. Sie sind ordnungsgemäß und leserlich auszufüllen. Dies betrifft vor allem Teilnehmer, Einzelergebnisse und Mannschaftsergebnisse. Bei unleserlichen Angaben erfolgt keine Wertung. Wettkampfort und -termin des nächsten Wettkampfes sind ebenfalls einzutragen.</p>
            <p>Vor der Abgabe der Protokolle hat der jeweilige Wettkampfleiter (Ausrichtender Verein) die Ergebnisse auf seine Richtigkeit hin zu überprüfen. Die Ergebnisse sind durch Unterschrift des Wettkampfleiters und des jeweiligen Mannschaftsführers zu bestätigen. Nachschießergebnisse müssen auf der Liste des darauffolgenden Durchgangs eingetragen werden, sonst gibt es keine Wertung des Durchgangs für den Schützen.</p>
            <p>Nach Beendigung des Wettkampfes sind die Protokolle dem RWK-Leiter innerhalb einer Frist von drei Tagen via E-Mail zuzustellen. Die bevorzugten Dateiformate dabei sind PDF, Excel oder JPEG/JPG. Die E-Mail-Adresse befindet sich auf den Protokollen.</p>
          </div>

          <div>
            <h4 id="section-12" className="font-semibold text-md !text-primary mt-3">12. Mannschaftswechsel und Ersatzschützen</h4>
            <p>Ist ein Teilnehmer innerhalb einer Klasse oder Liga bereits als Teil einer Mannschaft gewertet worden, kann er innerhalb dieser Klasse oder Liga nicht mehr als Teil einer anderen Mannschaft starten. Sollte ein Schütze komplett ausfallen (z.B. Krankheit), darf ein anderer Einzelschütze als Ersatzschütze einspringen. Die bisherigen Ergebnisse des Einzelschützen werden Transferiert.</p>
            <p>Sollte ein Schütze einspringen, der bisher nicht am RWK teilgenommen hat, wird das bisherige Ergebnis vom ausgefallenen Schützen übernommen und der Ersatzschütze nimmt nur noch an den bisher nicht stattgefunden Terminen teil.</p>
            <p>Sollte ein Einzelschütze die Mannschaft auffüllen der bisher nicht an jedem Durchgang teilgenommen hat, werden nur die vorhandenen Ergebnisse vom Einzelschützen übernommen, die nicht vorhandenen Ergebnisse werden vom ausgefallenden Schützen übernommen.</p>
            <p>Sollte kein Ersatz gefunden werden, werden zukünftigen Ergebnisse auf null gesetzt.</p>
            <p>In jedem Fall ist der RWK-Leiter zu Informieren.</p>
          </div>

          <div>
            <h4 id="section-13" className="font-semibold text-md !text-primary mt-3">13. Siegerehrung</h4>
            <p>Sieger des Rundenwettkampfes ist jeweils die Mannschaft und in der Einzelwertung der Schütze, mit der höchsten Gesamtringzahl.</p>
            <p>Die Damen, die in der offenen Klasse bzw. in gemischten Mannschaften mitschießen, werden von der Kreisdamenleiterin separat geführt und geehrt. Das Mannschaftsergebnis bleibt davon ausgenommen.</p>
            <p>In der Einzelwertung werden Urkunden an die Sieger ausgegeben. Als Auszeichnung erhält die Siegermannschaft einen Wanderpokal und eine Urkunde. Der Pokal muss bei der nächsten Siegerehrung zurückgegeben werden.</p>
            <p>Wird der Wanderpokal nicht rechtzeitig zurückgegeben, wird ein Strafgeld von 25,00€ dem Verein in Rechnung gestellt. Sollte der Pokal verloren gehen, wird ein Strafgeld von 50,00€ verhängt.</p>
          </div>
          
          <div>
            <h4 id="section-14" className="font-semibold text-md !text-primary mt-3">14. Einsprüche/Unstimmigkeiten</h4>
            <p>Alle Einsprüche oder sonstigen Vorkommnisse, die nicht an Ort und Stelle von den anwesenden Mannschaftsführern geregelt werden können, sind dem Rundenwettkampfleiter schriftlich unter Angabe der Gründe des Einspruches, oder der Vorkommnisse, mitzuteilen.</p>
            <p>Der Sportausschuss des KSV Einbeck berät über den Einspruch, die Sportkommission entscheidet dann endgültig darüber.</p>
            <p>Die Einspruchsgebühr beträgt 25,00 €.</p>
          </div>

          <div>
            <h4 id="section-15" className="font-semibold text-md !text-primary mt-3">15. Betrug/Betrugsversuch</h4>
            <p>Die Schusslöcher dürfen in keiner Art und Weise durch den Teilnehmer verändert werden, zum Beispiel durch Schusslochprüfer, Kugelschreiber oder ähnliche Gegenstände. Auch das Abkratzen der „Fransen“ von der Hinterseite einer beschossenen Scheibe ist nicht gestattet.</p>
            <p>Bei Verdacht auf Manipulation beschossener Scheiben sind diese unverzüglich in Zusammenarbeit mit den Mannschaftsführern, sicherzustellen und dem RWK-Leiter oder dem Kreisschießsportleiter zuzustellen.</p>
            <p>Im Verdachtsfall wird durch den Kreisschießsportleiter die Schießsportkommission gem. § 17 der Satzung einberufen, welche über das weitere Vorgehen in dem Fall zu entscheiden hat. Wird eine Manipulation der beschossenen Scheiben durch einen Teilnehmer zweifelsfrei festgestellt, so ist dieser Teilnehmer umgehend vom laufenden Wettkampf auszuschließen.</p>
          </div>

          <div>
            <h4 id="section-16" className="font-semibold text-md !text-primary mt-3">16. Auf- und Abstieg auf Kreisebene</h4>
            <p>Die erstplatzierte Mannschaft einer Klasse oder Liga steigt in die nächsthöhere Klasse oder Liga auf (ausgenommen Kreisoberliga). Die gruppenletzte Mannschaft steigt in die jeweils niedrigere Klasse oder Liga ab. Der zweite der Klasse oder Liga steigt ebenfalls auf, wenn sein Ergebnis besser ist, als der Vorletzte der höheren Klasse oder Liga. Dieser steigt dann auch ab.</p>
            <p>Ein direkter Aufstieg von z.B. der 2. Kreisklasse in die Kreisoberliga ist nicht möglich.</p>
            <p>Der direkte Abstieg von der Kreisoberliga in die 2. Kreisklasse ist ebenfalls nicht möglich.</p>
            <p>Steigen Mannschaften aus der Bezirksliga ab, werden diese auf Kreisebene in die Kreisoberliga eingruppiert. In diesem Fall ist es möglich, dass es in verschiedenen Gruppen mehrere Absteiger gibt, um den entsprechenden Startplatz für die Absteiger aus der höherklassigen Bezirksliga bereitzustellen. Dieses kann sich auch auf weitere Klassen auswirken. Auf der anderen Seite ist es möglich, dass Mannschaften aus niedrigeren Klassen die Kreisklassen oder die Kreisligen auffüllen müssen, wenn es mehrere Aufsteiger in die Bezirksliga gibt.</p>
            <p>Entscheidet der RWK-Leiter, die Anzahl der Mannschaften pro Klasse oder Liga im Vergleich zur Vorsaison zu verkleinern, ist es möglich, dass keine Mannschaft aufsteigen kann.</p>
            <p>Wenn eine Mannschaft nach Meldeschluss abgemeldet wird, steigt sie automatisch in die nächst niedrigere Klasse oder Liga ab, soweit dies möglich ist. Dies hat zur Folge, dass unter Umständen keine weitere Mannschaft aus Leistungsgründen absteigen würde.</p>
          </div>

          <div>
            <h4 id="section-17" className="font-semibold text-md !text-primary mt-3">17. Auf- und Abstieg in die Bezirksliga/Landesliga</h4>
            <p>Die Gruppensieger und Zweitplatzierten der Offenen Klasse Luftgewehr Freihand, Luftpistole und KK SpoPi sowie die Gruppensieger und Zweitplatzierten der Kreisoberliga KK, Luftgewehr Auflage qualifizieren sich auf Wunsch für das Aufstiegsschießen (Relegation) der Bezirksliga Göttingen.</p>
            <p>Stellt ein qualifizierter Verein eventuell schon eine Mannschaft in der Bezirksliga Göttingen, so qualifiziert sich auf Wunsch der dritt- oder viertplatzierte Verein für das Aufstiegsschiessen.</p>
            <p>Das Alter der Teilnehmer LG Auflage richtet sich nach der Ligaordnung des NSSV.</p>
            <p>Es ist möglich, dass die Bezirksliga Göttingen abweichende Mannschaftsgrößen vorschreibt. Zur Relegation qualifizierte Vereine sind dazu angehalten, die Anmeldeunterlagen genau zu prüfen. Über die tatsächliche Qualifikation der Mannschaften zur Relegation der Bezirksliga Göttingen werden die Vereine durch den RWK-Leiter der Bezirksliga Göttingen sowie auch durch den RWK-Leiter des KSV Einbeck informiert. Die Meldung mit der Ergebnisliste erfolgt jeweils zum Abschluss des jeweiligen Rundenwettkampfes.</p>
          </div>

          <div>
            <h4 id="section-18" className="font-semibold text-md !text-primary mt-3">18. Änderungen</h4>
            <p>Änderungen und Ergänzungen dieser Rundenwettkampfordnung sind nach Mehrheitsbeschluss auf einer Sportkommissionssitzung möglich.</p>
          </div>

          <div>
            <h4 id="section-19" className="font-semibold text-md !text-primary mt-3">19. Schlussbemerkung</h4>
            <p>Für alle in dieser Rundenwettkampfordnung nicht besonders aufgeführten Punkte sind die Regelungen der gültigen Sportordnung des DSB nach sportlichen Gesichtspunkten zu beachten.</p>
            <p>Mit der Meldung zur Veranstaltung erklären sich die Teilnehmer aus organisatorischen Gründen mit der elektronischen Speicherung der wettkampfrelevanten Daten, unter der Angabe von Namen, Vereinsname, Alter, Klasse, Wettkampfbezeichnung einverstanden. Sie willigen ebenfalls ein mit der Veröffentlichung von Fotos und der Start- und Ergebnislisten in Aushängen, im Internet und in weiteren Publikationen des KSVE sowie dessen Untergliederungen.</p>
            <p>Änderungen und Ergänzungen der Ausschreibungen bleiben dem Veranstalter vorbehalten.</p>
            <p>Der Rechtsweg ist ausgeschlossen.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    