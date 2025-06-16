import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document } from '@/lib/services/document-service';

interface FavoriteButtonProps {
  document: Document;
}

export function FavoriteButton({ document }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Lade Favoriten aus dem localStorage beim Laden der Komponente
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('documentFavorites') || '[]');
    setIsFavorite(favorites.includes(document.id));
  }, [document.id]);
  
  const toggleFavorite = () => {
    // Lade aktuelle Favoriten
    const favorites = JSON.parse(localStorage.getItem('documentFavorites') || '[]');
    
    // Füge hinzu oder entferne
    let newFavorites;
    if (isFavorite) {
      newFavorites = favorites.filter((id: string) => id !== document.id);
    } else {
      newFavorites = [...favorites, document.id];
    }
    
    // Speichere aktualisierte Favoriten
    localStorage.setItem('documentFavorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`p-1 h-7 w-7 ${isFavorite ? 'text-yellow-500' : 'text-muted-foreground'}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite();
      }}
      title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
    >
      <Star className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
    </Button>
  );
}