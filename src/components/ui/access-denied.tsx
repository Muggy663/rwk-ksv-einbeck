// src/components/ui/access-denied.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AccessDeniedProps {
  requiredRole?: string;
  currentRole?: string;
  message?: string;
}

export function AccessDenied({ requiredRole, currentRole, message }: AccessDeniedProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-destructive bg-destructive/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-destructive text-2xl">
            Zugriff verweigert
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {message || 'Sie haben keine Berechtigung für diesen Bereich.'}
          </p>
          
          {requiredRole && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <strong>Erforderliche Rolle:</strong> {requiredRole}
              </p>
              {currentRole && (
                <p className="text-sm text-muted-foreground">
                  <strong>Ihre Rolle:</strong> {currentRole}
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            <Button asChild variant="outline">
              <Link href="/dashboard-auswahl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zum Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/verein/dashboard">
                Vereinsbereich
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}