import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Shield, FileText } from 'lucide-react';

export default function UpdatePage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-primary">Version 0.9.9.5</h1>
      <p className="text-muted-foreground mb-6">Veröffentlicht am 21.07.2025</p>
      
      <Separator className="my-6" />
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download-Zähler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Neuer Download-Zähler für die Android-App</li>
              <li>Anzeige der Anzahl der Downloads auf der App-Seite</li>
              <li>Automatische Aktualisierung bei jedem Download</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Copyright-Informationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Neue Copyright-Seite mit detaillierten Informationen</li>
              <li>Meta-Tags für Suchmaschinen hinzugefügt</li>
              <li>Copyright-Header-Vorlage für kritische Dateien</li>
              <li>Link zur Copyright-Seite im Footer</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF-Verbesserungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Verbesserte PDF-Anzeige in der App</li>
              <li>Optimierte PDF-Downloads auf mobilen Geräten</li>
              <li>Fehlerbehebung bei der Anzeige von Dokumenten</li>
              <li>Bessere Benutzeroberfläche für PDF-Vorschau</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Weitere Änderungen</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Entfernung der Offline-Funktionalität</li>
              <li>Aktualisierung der App-Beschreibung</li>
              <li>Verbesserung der Benutzerfreundlichkeit</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
