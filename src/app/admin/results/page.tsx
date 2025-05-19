// src/app/admin/results/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';

export default function AdminResultsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Ergebniserfassung</h1>
        {/* Potentially add filter options for season/league/round here */}
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Ergebnisse für einen Wettkampftag erfassen</CardTitle>
          <CardDescription>
            Wählen Sie Saison, Liga, Durchgang und Begegnung aus, um Ergebnisse einzutragen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
            <p className="text-lg">Funktionalität zur Ergebniserfassung wird hier implementiert.</p>
            <p className="mt-2 text-sm">(Platzhalter für Formulare zur Ergebniseingabe)</p>
            <Button className="mt-4">
                <CheckSquare className="mr-2 h-5 w-5" /> Beispiel: Ergebnisse für DG1 speichern
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
