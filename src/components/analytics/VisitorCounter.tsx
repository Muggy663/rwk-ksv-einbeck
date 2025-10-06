// src/components/analytics/VisitorCounter.tsx
"use client";

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { getVisitorCount } from '@/lib/analytics/google-analytics';

export function VisitorCounter() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVisitorCount = async () => {
      try {
        const count = await getVisitorCount();
        setVisitorCount(count);
      } catch (error) {
        console.warn('Could not load visitor count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVisitorCount();
  }, []);

  if (isLoading) {
    return (
      <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap flex items-center">
        <Users className="w-3 h-3 mr-1 animate-pulse" />
        Lade Statistiken...
      </p>
    );
  }

  if (!visitorCount) return null;

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString('de-DE');
  };

  return (
    <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap flex items-center">
      <Users className="w-3 h-3 mr-1 text-primary/70" />
      {formatCount(visitorCount)} Besucher
    </p>
  );
}