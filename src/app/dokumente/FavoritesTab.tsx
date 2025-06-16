import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DocumentCard } from './DocumentCard';
import { Document } from '@/lib/services/document-service';
import { Star } from 'lucide-react';

interface FavoritesTabProps {
  allDocuments: Document[];
}

export function FavoritesTab({ allDocuments }: FavoritesTabProps) {
  const [favorites, setFavorites] = useState<Document[]>([]);
  
  // Lade Favoriten aus dem localStorage
  useEffect(() => {
    const loadFavorites = () => {
      const favoriteIds = JSON.parse(localStorage.getItem('documentFavorites') || '[]');
      const favoriteDocuments = allDocuments.filter(doc => favoriteIds.includes(doc.id));
      setFavorites(favoriteDocuments);
    };
    
    // Lade Favoriten beim ersten Rendern
    loadFavorites();
    
    // Füge einen Event-Listener hinzu, um Änderungen an localStorage zu erkennen
    window.addEventListener('storage', loadFavorites);
    
    // Eigener Event für Favoriten-Änderungen
    window.addEventListener('favoritesChanged', loadFavorites);
    
    return () => {
      window.removeEventListener('storage', loadFavorites);
      window.removeEventListener('favoritesChanged', loadFavorites);
    };
  }, [allDocuments]);
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Meine Favoriten</h2>
      
      {favorites.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <div className="flex flex-col items-center py-4">
              <Star className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p>Sie haben noch keine Favoriten gespeichert.</p>
              <p className="text-sm mt-1">
                Klicken Sie auf den Stern bei einem Dokument, um es zu Ihren Favoriten hinzuzufügen.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        favorites.map(doc => (
          <DocumentCard key={doc.id} document={doc} />
        ))
      )}
    </div>
  );
}