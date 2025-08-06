import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Smartphone, BarChart3 } from 'lucide-react';

export default function UpdatesV0994() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Version 0.9.9.4</h1>
        <p className="text-muted-foreground">Download-Zähler + Native App Support</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Download-Zähler für Dokumente
              <Badge variant="secondary">Neu</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Download-Tracking für alle PDF-Dokumente</li>
              <li>• Zentrale Speicherung in MongoDB</li>
              <li>• Anzeige der Download-Anzahl bei jeder Datei</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Native Android App
              <Badge variant="secondary">Beta</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Capacitor-Integration für native Apps</li>
              <li>• Android APK-Build-System</li>
              <li>• Installation ohne Play Store</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
