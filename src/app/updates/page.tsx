import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewspaperIcon } from 'lucide-react';

export default function UpdatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <NewspaperIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Updates</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Neueste Informationen & Änderungen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Alle wichtigen Updates und Nachrichten zu den Rundenwettkämpfen.
          </p>
          <div className="mt-6 p-8 text-center bg-secondary/30 rounded-md">
            <p className="text-lg">Der Update-Bereich wird derzeit aufgebaut.</p>
            <p className="mt-2 text-sm">(Platzhalter für Update-Liste)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
