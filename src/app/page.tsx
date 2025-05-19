import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <Image 
          src="/images/KSV_Einbeck_Abzeichen.png" 
          alt="KSV Einbeck Abzeichen"
          width={150}
          height={150}
          className="mx-auto mb-6 rounded-lg shadow-md"
          data-ai-hint="club emblem"
        />
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Willkommen beim Rundenwettkampf
        </h1>
        <p className="mt-2 text-xl text-muted-foreground">
          des Kreisschützenverbandes Einbeck e.V.
        </p>
      </section>

      <Separator />

      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-accent">Letzte Änderungen</CardTitle>
            <CardDescription>Aktuelle Updates zu den Rundenwettkämpfen.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">Hier werden bald die neuesten Änderungen und Ergebnisse der Rundenwettkämpfe angezeigt.</p>
              <p className="mt-2 text-sm">(Platzhalter für den Feed der letzten Updates)</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
