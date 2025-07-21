import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface MissingResultsAlertProps {
  teamId: string;
  teamName: string;
  missingRounds: number[];
  className?: string;
}

export function MissingResultsAlert({ 
  teamId, 
  teamName, 
  missingRounds,
  className = '' 
}: MissingResultsAlertProps) {
  if (missingRounds.length === 0) return null;
  
  return (
    <Alert variant="destructive" className={`border-red-300 bg-red-50 text-red-800 ${className}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Fehlende Ergebnisse für {teamName}</AlertTitle>
      <AlertDescription>
        <p className="mt-1">
          Es fehlen Ergebnisse für folgende Durchgänge: <strong>{missingRounds.join(', ')}</strong>
        </p>
        <p className="mt-2 text-sm">
          Fehlende Ergebnisse können die Gesamtwertung beeinflussen und zu einem schlechteren Tabellenplatz führen.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 bg-white border-red-300 hover:bg-red-100 text-red-800"
          asChild
        >
          <Link href={`/admin/results?teamId=${teamId}`}>
            Ergebnisse nachtragen
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}