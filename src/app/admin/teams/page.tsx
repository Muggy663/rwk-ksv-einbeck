// src/app/admin/teams/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function AdminTeamsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Mannschaftsverwaltung</h1>
        <Button>
          <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft anlegen
        </Button>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Vorhandene Mannschaften</CardTitle>
          <CardDescription>
            Mannschaften werden im Kontext einer Liga und Saison verwaltet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
            <p className="text-lg">Funktionalität zur Mannschaftsverwaltung wird hier implementiert.</p>
            <p className="mt-2 text-sm">(Platzhalter für Mannschaftsliste und Bearbeitungsoptionen)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
