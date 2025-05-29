import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardHat } from 'lucide-react';

export default function KmPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <HardHat className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">KM (Kreismeisterschaften)</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Bereich im Aufbau</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <HardHat className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Dieser Bereich ist in Kürze verfügbar!
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Wir arbeiten fleißig daran, Ihnen bald Informationen zu den Kreismeisterschaften zur Verfügung zu stellen.
            Vielen Dank für Ihre Geduld!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
