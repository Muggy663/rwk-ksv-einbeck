"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { 
  FileText, 
  Vote, 
  BookOpen, 
  Shield, 
  Users, 
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default function VereinsrechtDashboard() {
  return (
    <div className="container py-4 px-2 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <BackButton className="mr-2" fallbackHref="/dashboard-auswahl" />
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Vereinsrecht & Gemeinnützigkeit
          </h1>
        </div>
        <p className="text-muted-foreground">
          Rechtssichere Vereinsführung und Gemeinnützigkeits-Compliance
        </p>
      </div>

      {/* Schnellzugriff */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/vereinsrecht/protokolle">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Protokolle</h3>
              <p className="text-sm text-muted-foreground">Sitzungen dokumentieren</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/vereinsrecht/wahlen">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <Vote className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold">Wahlen</h3>
              <p className="text-sm text-muted-foreground">Vorstandswahlen digital</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/vereinsrecht/satzung">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold">Satzung</h3>
              <p className="text-sm text-muted-foreground">Satzung & Ordnungen</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/vereinsrecht/gemeinnuetzigkeit">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold">Gemeinnützigkeit</h3>
              <p className="text-sm text-muted-foreground">Steuerrecht & Compliance</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Status-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Aktuelle Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Freistellungsbescheid</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Gültig bis 2026</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Jahresabschluss 2024</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Eingereicht</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Vereinsregister</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Aktuell</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Anstehende Aufgaben
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Jahreshauptversammlung 2025</span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Bis März</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tätigkeitsbericht erstellen</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Bis Februar</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Vorstandswahl vorbereiten</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Bis März</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Letzte Aktivitäten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Letzte Aktivitäten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 pb-3 border-b">
              <FileText className="h-4 w-4 text-blue-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium">Vorstandssitzung protokolliert</p>
                <p className="text-xs text-muted-foreground">15.08.2025 - 8 Anwesende, 3 Beschlüsse</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b">
              <Vote className="h-4 w-4 text-green-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium">Kassenwart-Wahl durchgeführt</p>
                <p className="text-xs text-muted-foreground">12.08.2025 - Hans Müller gewählt (45 Ja, 2 Nein)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-orange-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium">Spendenbescheinigungen erstellt</p>
                <p className="text-xs text-muted-foreground">10.08.2025 - 23 Bescheinigungen für 2024</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}