"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UpdatesOverviewPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">Updates & Changelog</h1>
      
      <div className="mb-8">
        <Card className="border-primary/20 shadow-md hover:shadow-lg transition-all">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xl text-primary flex items-center justify-between">
              <span>Aktuelle Version: 0.9.3 (24. Juni 2025)</span>
              <span className="text-sm bg-primary/20 px-2 py-1 rounded-full flex items-center gap-1">
                <span>Beta</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4">Bugfix-Update zur Behebung von Problemen und Verbesserung der Stabilität.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>🐛 Korrektur der Ergebniserfassung und Team-Anzeige</li>
              <li>🔒 Behebung von Berechtigungsproblemen bei Liga-Updates</li>
              <li>📊 Filterung von Saisons in Statistiken (nur laufende/abgeschlossene)</li>
              <li>⚡ Verbesserung der Stabilität durch Optimierung der Offline-Funktionen</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/updates/v0.9.3">Details zu Version 0.9.3</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Version 0.9.x</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Mobile Optimierungen, Statistik-Dashboard und Performance-Verbesserungen.</p>
            <p className="text-sm text-muted-foreground mt-2">0.9.0 - 0.9.3</p>
          </CardContent>
          <CardFooter>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/updates/v0.9">v0.9.0</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/updates/v0.9.1">v0.9.1</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/updates/v0.9.2">v0.9.2</Link>
              </Button>
              <Button asChild>
                <Link href="/updates/v0.9.3">v0.9.3</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Version 0.8.x</CardTitle>
          </CardHeader>
          <CardContent>
            <p>UI-Modernisierung und strukturierte Update-Dokumentation.</p>
            <p className="text-sm text-muted-foreground mt-2">0.8.0 - 0.8.5</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/updates/v0.8">Details anzeigen</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Version 0.7.x</CardTitle>
          </CardHeader>
          <CardContent>
            <p>MongoDB-Integration und Dokumentenverwaltung.</p>
            <p className="text-sm text-muted-foreground mt-2">0.7.0 - 0.7.5</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/updates/v0.7">Details anzeigen</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Version 0.6.x</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Erweiterte Funktionen und Optimierungen.</p>
            <p className="text-sm text-muted-foreground mt-2">0.6.0 - 0.6.3</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/updates/v0.6">Details anzeigen</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Version 0.5.x</CardTitle>
          </CardHeader>
          <CardContent>
            <p>UX-Verbesserungen und Benutzerfreundlichkeit.</p>
            <p className="text-sm text-muted-foreground mt-2">0.5.0 - 0.5.1</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/updates/v0.5">Details anzeigen</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Version 0.4.x</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Berechtigungen und Benutzerführung.</p>
            <p className="text-sm text-muted-foreground mt-2">0.4.0</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/updates/v0.4">Details anzeigen</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Version 0.3.x</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Verbesserungen der Kernfunktionen und Benutzeroberfläche.</p>
            <p className="text-sm text-muted-foreground mt-2">0.3.0 - 0.3.5</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/updates/v0.3">Details anzeigen</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Version 0.2.x</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Frühe Entwicklungsphase mit grundlegenden Funktionen.</p>
            <p className="text-sm text-muted-foreground mt-2">0.2.0 - 0.2.6a</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/updates/v0.2">Details anzeigen</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-all border-dashed border-muted-foreground/30">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Version 1.x (Geplant)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Erste stabile Version mit vollständigem Funktionsumfang.</p>
            <p className="text-sm text-muted-foreground mt-2">Erscheint voraussichtlich Ende 2025</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/updates/v1">Details anzeigen</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}