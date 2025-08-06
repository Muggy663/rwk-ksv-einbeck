import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings, Users, Shield, Bug, Trash2 } from 'lucide-react';

export default function UpdatePage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-primary">Version 0.9.9.6a</h1>
      <p className="text-muted-foreground mb-6">Veröffentlicht am 22.01.2025</p>
      
      <Separator className="my-6" />
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Admin-Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Team-Bereinigungstool für ungültige Schützen-IDs</li>
              <li>Excel-Schützen Normalisierungstool mit manueller Überprüfung</li>
              <li>Kreuznavigation zwischen RWK Admin und KM Admin Dashboards</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Benutzer-Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Login-Weiterleitung für RWK-Admins korrigiert</li>
              <li>Schützen-Erstellung: birthYear undefined Fehler behoben</li>
              <li>Team-Löschung: Behandlung ungültiger Schützen-Referenzen</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Fehlerbehebungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>TypeScript-Kompilierungsfehler in JSX-Komponenten behoben</li>
              <li>HTML-Entitäten in Benutzer-Management korrigiert</li>
              <li>Firestore-Constraints für undefined-Werte berücksichtigt</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Entfernte Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>PWA-Installationseinblendung entfernt (30-Sekunden-Timer)</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Technische Verbesserungen</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Datenintegrität: Ungültige Schützen-IDs in Teams verursachten Fehler bei der Ergebniseingabe</li>
              <li>Excel-Import: Unterschiedliche Datenstrukturen (kmClubId vs clubId) normalisiert</li>
              <li>Batch-Operationen: Validierung der Schützen-Existenz vor Updates</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
