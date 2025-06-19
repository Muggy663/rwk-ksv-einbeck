"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  UserCog, 
  Users, 
  Building, 
  FileBarChart, 
  Calendar, 
  FileText, 
  History, 
  RefreshCw, 
  Settings,
  BarChart3
} from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCog className="mr-2 h-5 w-5" />
              Benutzerverwaltung
            </CardTitle>
            <CardDescription>
              Benutzer und Berechtigungen verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Verwalten Sie Benutzer, weisen Sie Rollen zu und verwalten Sie Berechtigungen.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/user-management">Zur Benutzerverwaltung</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Vereinsverwaltung
            </CardTitle>
            <CardDescription>
              Vereine und Mannschaften verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Verwalten Sie Vereine, Mannschaften und deren Zuordnungen zu Ligen.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/clubs">Zur Vereinsverwaltung</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileBarChart className="mr-2 h-5 w-5" />
              Ligaverwaltung
            </CardTitle>
            <CardDescription>
              Ligen und Wettkämpfe verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Verwalten Sie Ligen, Wettkämpfe und Ergebnisse.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/leagues">Zur Ligaverwaltung</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Terminverwaltung
            </CardTitle>
            <CardDescription>
              Termine und Veranstaltungen verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Verwalten Sie Termine, Wettkämpfe und andere Veranstaltungen.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/termine">Zur Terminverwaltung</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Dokumentenverwaltung
            </CardTitle>
            <CardDescription>
              Dokumente und Dateien verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Verwalten Sie Dokumente, Ausschreibungen und andere Dateien.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/documents">Zur Dokumentenverwaltung</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="mr-2 h-5 w-5" />
              Änderungsprotokoll
            </CardTitle>
            <CardDescription>
              Änderungen und Aktivitäten einsehen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Sehen Sie alle Änderungen und Aktivitäten in der Anwendung ein.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/audit">Zum Änderungsprotokoll</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5" />
              Datenbereinigung
            </CardTitle>
            <CardDescription>
              Datenbank bereinigen und optimieren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Bereinigen Sie verwaiste Referenzen und optimieren Sie die Datenbank.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/cleanup">Zur Datenbereinigung</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Erweiterte Statistiken
            </CardTitle>
            <CardDescription>
              Detaillierte Statistiken und Analysen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Sehen Sie detaillierte Statistiken und Analysen zu Schützen und Mannschaften.
            </p>
            <Button asChild className="w-full">
              <Link href="/statistiken">Zu den Statistiken</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Systemeinstellungen
            </CardTitle>
            <CardDescription>
              Allgemeine Einstellungen verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Verwalten Sie allgemeine Einstellungen der Anwendung.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/settings">Zu den Einstellungen</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}