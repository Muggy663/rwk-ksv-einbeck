"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Newspaper, Plus, Info } from 'lucide-react';
import { NewsForm } from '@/components/news/NewsForm';
import { NewsList } from '@/components/news/NewsList';
import { NewsArticle } from '@/lib/services/news-service';
import { useAuth } from '@/hooks/use-auth';

export default function NewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [editingArticle, setEditingArticle] = useState<NewsArticle | undefined>();

  const isAdmin = user?.email === 'admin@rwk-einbeck.de';

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setActiveTab('form');
  };

  const handleFormSuccess = () => {
    setEditingArticle(undefined);
    setActiveTab('list');
  };

  const handleFormCancel = () => {
    setEditingArticle(undefined);
    setActiveTab('list');
  };

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Newspaper className="h-8 w-8" />
          News
        </h1>
        <p className="text-muted-foreground mt-2">
          Offizielle Mitteilungen und Neuigkeiten des Kreisschützenverbandes Einbeck.
        </p>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Über RWK-News
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Kategorien:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><span className="font-medium text-blue-600">Allgemein</span> - Allgemeine Informationen</li>
                  <li><span className="font-medium text-green-600">Ergebnisse</span> - Wettkampfergebnisse</li>
                  <li><span className="font-medium text-purple-600">Termine</span> - Wichtige Termine</li>
                  <li><span className="font-medium text-orange-600">Regeländerung</span> - Neue Regeln</li>
                  <li><span className="font-medium text-red-600">Wichtig</span> - Dringende Mitteilungen</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Features:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Push-Benachrichtigungen für neue Artikel</li>
                  <li>Kategorisierung und Filterung</li>
                  <li>Prioritäten und Pinning</li>
                  <li>Zielgruppen-spezifische Artikel</li>
                  <li>Content-Filter für angemessene Inhalte</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isAdmin ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Alle Artikel</TabsTrigger>
            <TabsTrigger value="form">
              {editingArticle ? 'Artikel bearbeiten' : 'Neuer Artikel'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Alle News-Artikel</h2>
              <Button onClick={() => setActiveTab('form')}>
                <Plus className="w-4 h-4 mr-2" />
                Neuer Artikel
              </Button>
            </div>
            <NewsList showAll={true} onEdit={handleEdit} />
          </TabsContent>

          <TabsContent value="form">
            <NewsForm 
              article={editingArticle}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Aktuelle Nachrichten</h2>
          </div>
          <NewsList showAll={false} limit={20} />
        </div>
      )}
    </div>
  );
}
