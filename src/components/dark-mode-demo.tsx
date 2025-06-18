"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DarkModeDemo() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Helles Design</CardTitle>
            <CardDescription>Standard-Farbschema</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Optimiert für Tageslicht und helle Umgebungen.</p>
          </CardContent>
          <CardFooter>
            <Button 
              variant={theme === 'light' ? 'default' : 'outline'} 
              onClick={() => setTheme('light')}
              className="w-full"
            >
              <Sun className="mr-2 h-4 w-4" />
              Hell aktivieren
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Dunkles Design</CardTitle>
            <CardDescription>Reduzierte Helligkeit</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Angenehm für die Augen bei Nacht oder in dunklen Umgebungen.</p>
          </CardContent>
          <CardFooter>
            <Button 
              variant={theme === 'dark' ? 'default' : 'outline'} 
              onClick={() => setTheme('dark')}
              className="w-full"
            >
              <Moon className="mr-2 h-4 w-4" />
              Dunkel aktivieren
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System-Design</CardTitle>
            <CardDescription>Folgt Ihren Systemeinstellungen</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Passt sich automatisch an Ihre Betriebssystem-Einstellungen an.</p>
          </CardContent>
          <CardFooter>
            <Button 
              variant={theme === 'system' ? 'default' : 'outline'} 
              onClick={() => setTheme('system')}
              className="w-full"
            >
              <Monitor className="mr-2 h-4 w-4" />
              System verwenden
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>UI-Komponenten im Dunkelmodus</CardTitle>
            <CardDescription>Beispiele für verschiedene UI-Elemente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Max Mustermann" />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge>Standard</Badge>
              <Badge variant="secondary">Sekundär</Badge>
              <Badge variant="destructive">Warnung</Badge>
              <Badge variant="outline">Umriss</Badge>
            </div>
            
            <Tabs defaultValue="tab1" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="p-4 border rounded-md mt-2">
                Inhalt von Tab 1
              </TabsContent>
              <TabsContent value="tab2" className="p-4 border rounded-md mt-2">
                Inhalt von Tab 2
              </TabsContent>
              <TabsContent value="tab3" className="p-4 border rounded-md mt-2">
                Inhalt von Tab 3
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Vorteile des Dunkelmodus</CardTitle>
            <CardDescription>Warum ein Dunkelmodus sinnvoll ist</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Reduziert die Augenbelastung bei Verwendung in dunklen Umgebungen</li>
              <li>Kann den Akkuverbrauch bei OLED- und AMOLED-Displays reduzieren</li>
              <li>Verbessert die Lesbarkeit für manche Nutzer mit Sehbehinderungen</li>
              <li>Bietet eine moderne und elegante Alternative zum hellen Design</li>
              <li>Passt sich automatisch an die Systemeinstellungen des Nutzers an</li>
            </ul>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Aktuelles Theme: <span className="font-medium">{theme === 'system' ? 'System' : theme === 'dark' ? 'Dunkel' : 'Hell'}</span>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}