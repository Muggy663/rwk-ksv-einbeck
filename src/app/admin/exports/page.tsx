"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ExportsPage() {
  // Direkt zur Urkunden-Seite weiterleiten
  useEffect(() => {
    window.location.href = '/admin/exports/certificates';
  }, []);





  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">PDF-Exporte</h1>
          <p className="text-muted-foreground">
            Erstellen Sie PDFs für Ergebnislisten und Urkunden.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            Zurück zum Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="mr-2 h-5 w-5" />
            Weiterleitung zu Urkunden
          </CardTitle>
          <CardDescription>
            Sie werden automatisch zur Urkunden-Seite weitergeleitet...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Falls die Weiterleitung nicht funktioniert, klicken Sie hier:</p>
          <Link href="/admin/exports/certificates" className="text-primary underline">
            Zu den Urkunden
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
