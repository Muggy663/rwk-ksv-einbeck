"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Plus, FileText } from 'lucide-react';
import { ProtestForm } from '@/components/protests/ProtestForm';
import { ProtestList } from '@/components/protests/ProtestList';
import { useAuth } from '@/hooks/use-auth';

export default function ProtestsPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  const isAdmin = user?.email === 'admin@rwk-einbeck.de';

  if (!user) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Sie müssen angemeldet sein, um Proteste einzusehen oder einzureichen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <AlertTriangle className="h-8 w-8" />
          Protest-System
        </h1>
        <p className="text-muted-foreground mt-2">
          Digitale Einsprüche und Beschwerden für den Rundenwettkampf.
        </p>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Über das Protest-System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Workflow:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Protest einreichen (Alle Benutzer)</li>
                  <li>Prüfung durch Rundenwettkampfleiter</li>
                  <li>Entscheidung und Benachrichtigung</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium mb-2">Kategorien:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ergebnis-Einsprüche</li>
                  <li>Verhalten von Teilnehmern</li>
                  <li>Regelverstöße</li>
                  <li>Sonstige Beschwerden</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Meine Proteste</TabsTrigger>
          <TabsTrigger value="new">Neuer Protest</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {isAdmin ? 'Alle Proteste' : 'Meine Proteste'}
            </h2>
            <Button onClick={() => setActiveTab('new')}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Protest
            </Button>
          </div>
          <ProtestList showAll={isAdmin} />
        </TabsContent>

        <TabsContent value="new">
          <ProtestForm 
            onSuccess={() => {
              setActiveTab('list');
            }}
            onCancel={() => setActiveTab('list')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}