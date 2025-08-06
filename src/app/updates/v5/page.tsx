"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function Version5UpdatesPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/updates" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary">Updates & Changelog: Version 5.x</h1>
        <p className="text-muted-foreground mt-2">Zukünftige Version</p>
      </div>
      
      <Card className="border-dashed border-muted-foreground/30">
        <CardHeader>
          <CardTitle className="text-xl text-muted-foreground">Version 5.0 (Zukunftsplanung)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Diese Version ist für die zukünftige Entwicklung vorgesehen.</p>
        </CardContent>
      </Card>
    </div>
  );
}
