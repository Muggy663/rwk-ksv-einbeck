// src/app/admin/leagues/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function AdminLeaguesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Ligenverwaltung</h1>
        <Button>
          <PlusCircle className="mr-2 h-5 w-5" /> Neue Liga anlegen
        </Button>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Vorhandene Ligen</CardTitle>
          <CardDescription>
            Ligen werden im Kontext einer Saison verwaltet. Wählen Sie eine Saison aus, um Ligen anzuzeigen oder hinzuzufügen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
            <p className="text-lg">Funktionalität zur Ligenverwaltung wird hier implementiert.</p>
            <p className="mt-2 text-sm">(Platzhalter für Ligaliste und Bearbeitungsoptionen)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
