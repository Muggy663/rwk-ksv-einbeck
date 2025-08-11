"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configId = searchParams.get('id');

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">🎯 Startlisten generieren</h1>
          <p className="text-muted-foreground">Config ID: {configId}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Startlisten-Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Seite funktioniert ohne Weiterleitung.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Firebase-Integration wird schrittweise hinzugefügt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}