import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableIcon } from 'lucide-react';

export default function RwkTabellenPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <TableIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">RWK Tabellen</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Aktuelle Tabellenstände</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Hier werden die aktuellen Tabellen der Rundenwettkämpfe angezeigt.
          </p>
          <div className="mt-6 p-8 text-center bg-secondary/30 rounded-md">
            <p className="text-lg">Die Tabellenansicht befindet sich noch in Entwicklung.</p>
            <p className="mt-2 text-sm">(Platzhalter für Tabellen)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
