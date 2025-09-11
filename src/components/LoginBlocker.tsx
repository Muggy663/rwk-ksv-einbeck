// src/components/LoginBlocker.tsx
"use client";

import React from 'react';
import { AlertTriangle, Calendar, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginBlocker() {
  // Login blockieren ab 15.09.2025
  const blockDate = new Date('2025-09-15T00:00:00');
  const currentDate = new Date();
  const isLoginBlocked = currentDate >= blockDate;

  if (!isLoginBlocked) {
    return null; // Kein Block vor dem 15.09.
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-orange-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-orange-900">
            🚧 Wartungsarbeiten im Gange
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-orange-800 mb-4">
              Die RWK App wird gerade auf das neue Benutzerrollen-System umgestellt.
            </p>
            <div className="bg-orange-100 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-900">Voraussichtliche Dauer:</span>
              </div>
              <p className="text-orange-800">15.09.2025 - 16.09.2025</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Neue Benutzerrollen ab 16.09.2025:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏃♂️</span>
                  <div>
                    <strong>Sportleiter</strong>
                    <p className="text-blue-700">RWK + KM Vollzugriff</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <div>
                    <strong>Kassenwart</strong>
                    <p className="text-blue-700">Mitglieder + Finanzen</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <div>
                    <strong>Schriftführer</strong>
                    <p className="text-blue-700">Protokolle + Mitglieder</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👔</span>
                  <div>
                    <strong>Vereinsvorstand</strong>
                    <p className="text-blue-700">Vollzugriff alle Bereiche</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <div>
                    <strong>KM-Orga</strong>
                    <p className="text-blue-700">Kreismeisterschafts-Verwaltung</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔧</span>
                  <div>
                    <strong>Admin</strong>
                    <p className="text-blue-700">System-Administration</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-900">Wichtiger Hinweis:</span>
            </div>
            <p className="text-red-800">
              <strong>RWK Luftdruck Meldeschluss: 15.09.2025</strong><br/>
              Alle Meldungen müssen bis heute eingegangen sein!
            </p>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Bei Fragen wenden Sie sich an:</p>
            <p className="font-medium">rwk-leiter-ksve@gmx.de</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}