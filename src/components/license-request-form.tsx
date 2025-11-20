"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/components/auth/AuthContext';

export function LicenseRequestForm() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRequestTrial = async () => {
    setLoading(true);
    try {
      // E-Mail an Admin senden (vereinfacht)
      const subject = `Vereinssoftware Testlizenz-Anfrage von ${user?.email}`;
      const body = `
Hallo,

${user?.displayName || user?.email} möchte eine 3-monatige Testlizenz für die Vereinssoftware beantragen.

Benutzer-Details:
- E-Mail: ${user?.email}
- Name: ${user?.displayName || 'Nicht angegeben'}
- Angefragt am: ${new Date().toLocaleString('de-DE')}

Bitte aktivieren Sie die Testlizenz über das Admin-Panel:
/admin/license-management

Vielen Dank!
      `;

      // Mailto-Link öffnen (einfachste Lösung)
      const mailtoLink = `mailto:rwk-leiter-ksve@gmx.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      
      setSubmitted(true);
    } catch (error) {
      console.error('Error requesting license:', error);
      alert('Fehler beim Senden der Anfrage');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestFull = async () => {
    setLoading(true);
    try {
      const subject = `Vereinssoftware Vollversion-Anfrage von ${user?.email}`;
      const body = `
Hallo,

${user?.displayName || user?.email} möchte eine Vollversion der Vereinssoftware erwerben.

Benutzer-Details:
- E-Mail: ${user?.email}
- Name: ${user?.displayName || 'Nicht angegeben'}
- Verein: [Bitte angeben]
- Mitgliederzahl: [Bitte angeben]
- Angefragt am: ${new Date().toLocaleString('de-DE')}

Bitte kontaktieren Sie den Benutzer für weitere Details und Preisgestaltung.

Vielen Dank!
      `;

      const mailtoLink = `mailto:rwk-leiter-ksve@gmx.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      
      setSubmitted(true);
    } catch (error) {
      console.error('Error requesting license:', error);
      alert('Fehler beim Senden der Anfrage');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold mb-2">Anfrage gesendet!</h3>
          <p className="text-gray-600 mb-4">
            Ihre Lizenz-Anfrage wurde an den Administrator gesendet. 
            Sie erhalten in Kürze eine Antwort.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard-auswahl'}
          >
            Zurück zum Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Vereinssoftware-Lizenz beantragen</h2>
        <p className="text-gray-600">
          Wählen Sie die passende Option für Ihren Verein
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Testlizenz */}
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-xl text-orange-700">
              🚀 3-Monate Testlizenz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold text-orange-600">KOSTENLOS</div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm">Alle Funktionen verfügbar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm">3 Monate Laufzeit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm">Keine Kündigung erforderlich</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm">Support inklusive</span>
                </div>
              </div>

              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={handleRequestTrial}
                disabled={loading}
              >
                {loading ? 'Sende Anfrage...' : 'Testlizenz beantragen'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vollversion */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-xl text-blue-700">
              💎 Vollversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold text-blue-600">Auf Anfrage</div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm">Alle Funktionen unbegrenzt</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm">Prioritäts-Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm">Individuelle Anpassungen</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm">Schulungen verfügbar</span>
                </div>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleRequestFull}
                disabled={loading}
              >
                {loading ? 'Sende Anfrage...' : 'Vollversion anfragen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>
          Bei Fragen kontaktieren Sie uns direkt: 
          <strong> rwk-leiter-ksve@gmx.de</strong>
        </p>
      </div>
    </div>
  );
}
