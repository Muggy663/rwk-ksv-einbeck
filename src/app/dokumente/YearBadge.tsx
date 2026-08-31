import React from 'react';
import { Calendar } from 'lucide-react';

interface YearBadgeProps {
  title: string;
  description: string;
}

export function YearBadge({ title, description }: YearBadgeProps) {
  // Suche nach Jahreszahlen im Format 20XX im Titel oder in der Beschreibung
  const titleMatch = title.match(/\b(20\d{2})\b/);
  const descriptionMatch = description.match(/\b(20\d{2})\b/);
  
  // Verwende das erste gefundene Jahr oder nichts
  const year = titleMatch?.[1] || descriptionMatch?.[1];
  
  if (!year) return null;
  
  return (
    <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium ml-2">
      <Calendar className="h-3 w-3 mr-1" />
      {year}
    </div>
  );
}
