"use client";

import { Button } from "@/components/ui/button";
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default function AGBPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis/premium">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Premium
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Allgemeine Geschäftsbedingungen</h1>
            <p className="text-muted-foreground">Premium Schießnachweis Service</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AGB für Premium Schießnachweis</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-6">
          
          <section>
            <h3 className="text-lg font-semibold mb-3">§ 1 Geltungsbereich</h3>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über die Nutzung des Premium Schießnachweis Service, 
              die zwischen Marcel Bünger (nachfolgend "Anbieter") und dem Nutzer (nachfolgend "Kunde") geschlossen werden.
            </p>
            <div className="bg-muted p-4 rounded-lg mt-3">
              <p className="text-sm">
                <strong>Anbieter:</strong><br/>
                Marcel Bünger<br/>
                RWK-Leiter KSV Einbeck<br/>
                E-Mail: rwk-leiter-ksve@gmx.de
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">§ 4 Preise und Zahlungsbedingungen</h3>
            <div className="space-y-3">
              <p><strong>Aktuelle Preise (Kleinunternehmerregelung - keine MwSt.):</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>1 Monat: 2,00 €</li>
                <li>3 Monate: 6,00 €</li>
                <li>12 Monate: 20,00 € (entspricht 1,67 € pro Monat)</li>
              </ul>
              <p>
                Die Zahlung erfolgt ausschließlich über PayPal. Bei Jahresabonnements wird der Gesamtbetrag sofort fällig.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">§ 5 Widerrufsrecht</h3>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <p className="font-medium mb-2">Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>
              <p>
                Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses. 
                Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer eindeutigen Erklärung 
                (z.B. per E-Mail an rwk-leiter-ksve@gmx.de) über Ihren Entschluss informieren.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">§ 10 Steuerliche Hinweise</h3>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
              <p>
                <strong>Kleinunternehmerregelung:</strong> Der Anbieter ist Kleinunternehmer im Sinne von § 19 UStG. 
                Daher wird keine Umsatzsteuer berechnet und ausgewiesen. 
                <strong>Umsatzsteuerfreie Kleinunternehmerleistung gemäß § 19 UStG.</strong>
              </p>
            </div>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-muted-foreground">
              <strong>Stand:</strong> Januar 2025<br/>
              <strong>Kontakt:</strong> rwk-leiter-ksve@gmx.de
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
