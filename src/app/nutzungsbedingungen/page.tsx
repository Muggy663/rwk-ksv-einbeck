// src/app/nutzungsbedingungen/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NutzungsbedingungenPage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-primary mb-6">Nutzungsbedingungen</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Allgemeine Geschäftsbedingungen für die RWK App Einbeck</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Stand: Juni 2025</p>
          
          <section>
            <h3 className="text-lg font-semibold mb-2">1. Geltungsbereich</h3>
            <p>Diese Nutzungsbedingungen gelten für die Nutzung der RWK App Einbeck, einer Webanwendung zur Verwaltung von Rundenwettkämpfen des Kreisschützenverbandes Einbeck.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">2. Urheberrecht und geistiges Eigentum</h3>
            <p>Die gesamte Software, einschließlich aller Texte, Grafiken, Benutzeroberflächen, visuellen Schnittstellen, Fotografien, Marken, Logos, Sounds, Musik, Kunstwerke und Computercodes (zusammen "Inhalte"), ist Eigentum von Marcel Bünger und durch deutsche und internationale Urheberrechts- und Markengesetze geschützt.</p>
            <p className="mt-2">© 2025 Marcel Bünger für den KSV Einbeck. Alle Rechte vorbehalten.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">3. Erlaubte Nutzung</h3>
            <p>Die Nutzung der RWK App Einbeck ist ausschließlich für Mitglieder und autorisierte Personen des Kreisschützenverbandes Einbeck bestimmt. Die Nutzung erfolgt auf eigene Verantwortung.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">4. Verbotene Aktivitäten</h3>
            <p>Es ist untersagt:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Die Software zu kopieren, zu modifizieren oder zu verbreiten</li>
              <li>Reverse Engineering, Dekompilierung oder Disassemblierung durchzuführen</li>
              <li>Unbefugten Zugang zu erlangen oder zu versuchen</li>
              <li>Die Anwendung für rechtswidrige Zwecke zu nutzen</li>
              <li>Daten anderer Nutzer ohne Berechtigung zu verwenden</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">5. Benutzerdaten und Datenschutz</h3>
            <p>Der Umgang mit personenbezogenen Daten erfolgt gemäß unserer Datenschutzerklärung und den geltenden Datenschutzgesetzen.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">6. Haftungsausschluss</h3>
            <p>Die Nutzung der RWK App Einbeck erfolgt auf eigenes Risiko. Marcel Bünger und der KSV Einbeck übernehmen keine Gewähr für die Verfügbarkeit, Richtigkeit oder Vollständigkeit der bereitgestellten Informationen.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">7. Änderungen</h3>
            <p>Diese Nutzungsbedingungen können jederzeit geändert werden. Nutzer werden über wesentliche Änderungen informiert.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">8. Anwendbares Recht</h3>
            <p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">9. Kontakt</h3>
            <p>Bei Fragen zu diesen Nutzungsbedingungen wenden Sie sich bitte an:</p>
            <p className="mt-2">
              <strong>Marcel Bünger</strong><br />
              Rundenwettkampfleiter KSV Einbeck<br />
              E-Mail: rwk-leiter-ksve@gmx.de
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
